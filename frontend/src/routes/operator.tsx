import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Loader2, Pencil, Plus, Save, Table2, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Donut, Reveal } from "@/components/motion";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { LEAGUES, VILOYATLAR } from "@/lib/micco-data";
import { avatarFor } from "@/lib/rating-api";

// Katta suratlarni saqlashdan oldin kichraytiramiz (data URL sifatida backendga
// yuboriladi va reytingda ham shu surat ishlatiladi).
const MAX_PHOTO_DIMENSION = 480;

function readAndResizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, MAX_PHOTO_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas kontekstini ochib bo'lmadi."));
        return;
      }
      ctx.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Suratni o'qib bo'lmadi."));
    };
    image.src = url;
  });
}

export const Route = createFileRoute("/operator")({
  head: () => ({
    meta: [
      { title: "Operator paneli — agentlarni tizimga kiritish | MICCO" },
      {
        name: "description",
        content: "Agentlarni qo'shish, supervayzer biriktirish va mahsulot bo'yicha oylik natija kiritish.",
      },
      { property: "og:title", content: "MICCO Operator paneli" },
      { property: "og:description", content: "Xodimlar jadvali, yangi agent qo'shish va oylik natija oqimi." },
    ],
  }),
  component: OperatorPage,
});

type IshchiRow = {
  id: number;
  ism: string;
  familiya: string;
  supervayzerId: number;
  supervayzerFullName: string;
  ishGaKirganSana: string;
  active: boolean;
  boshlangichLiga: string | null;
  rasm: string | null;
  viloyat: string | null;
};

type MahsulotRow = { id: number; nomi: string; birlik: string; standartPlan: number };
type SupervayzerRow = { id: number; ism: string; familiya: string; createdByFullName: string | null };
type NatijaRow = { ishchiId: number; mahsulotId: number; plan: number; bajarildi: number };

const EMPTY_ISHCHI_FORM = {
  ism: "",
  familiya: "",
  supervayzerId: "",
  ishGaKirganSana: "",
  active: true,
  boshlangichLiga: "rising",
  viloyat: "",
};

const FILTER_ALL = "__ALL__";

function todayMonthInput(): string {
  return new Date().toISOString().slice(0, 7) + "-01";
}

function OperatorPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSupervayzer = user?.role === "SUPERVAYZER";
  // Menejer agent qo'sha/tahrirlay/faolsizlantira oladi, lekin o'chira olmaydi (backend ham shunday cheklaydi).
  const canDeleteIshchi = user?.role !== "MENEJER";

  const { data: ishchilar = [], isLoading: loadingIshchilar } = useQuery({
    queryKey: ["ishchilar"],
    queryFn: () => api.get<IshchiRow[]>("/api/ishchilar"),
  });
  const { data: mahsulotlar = [] } = useQuery({
    queryKey: ["mahsulotlar"],
    queryFn: () => api.get<MahsulotRow[]>("/api/mahsulotlar"),
  });
  const { data: supervayzerlar = [] } = useQuery({
    queryKey: ["users", "supervayzers"],
    queryFn: () => api.get<SupervayzerRow[]>("/api/users/supervayzers"),
    enabled: !isSupervayzer,
  });

  // --- Ro'yxat filtrlari (Supervayzer / Menejer / Liga / Viloyat) ---
  const showSupervayzerFilter = !isSupervayzer;
  const showMenejerFilter = user?.role === "ADMIN" || user?.role === "OPERATOR";
  const [filterSupervayzerId, setFilterSupervayzerId] = useState(FILTER_ALL);
  const [filterMenejer, setFilterMenejer] = useState(FILTER_ALL);
  const [filterLiga, setFilterLiga] = useState(FILTER_ALL);
  const [filterViloyat, setFilterViloyat] = useState(FILTER_ALL);

  const supervayzerById = useMemo(
    () => new Map(supervayzerlar.map((s) => [s.id, s])),
    [supervayzerlar],
  );
  const menejerlar = useMemo(
    () => Array.from(new Set(supervayzerlar.map((s) => s.createdByFullName).filter((n): n is string => !!n))),
    [supervayzerlar],
  );

  const filteredIshchilar = useMemo(() => {
    return ishchilar.filter((s) => {
      if (filterSupervayzerId !== FILTER_ALL && String(s.supervayzerId) !== filterSupervayzerId) return false;
      if (filterMenejer !== FILTER_ALL && supervayzerById.get(s.supervayzerId)?.createdByFullName !== filterMenejer) return false;
      if (filterLiga !== FILTER_ALL && (s.boshlangichLiga ?? "rising") !== filterLiga) return false;
      if (filterViloyat !== FILTER_ALL && s.viloyat !== filterViloyat) return false;
      return true;
    });
  }, [ishchilar, filterSupervayzerId, filterMenejer, filterLiga, filterViloyat, supervayzerById]);

  const hasActiveFilter =
    filterSupervayzerId !== FILTER_ALL || filterMenejer !== FILTER_ALL || filterLiga !== FILTER_ALL || filterViloyat !== FILTER_ALL;

  // --- Yangi ishchi qo'shish / tahrirlash (modal) ---
  const [ishchiForm, setIshchiForm] = useState(EMPTY_ISHCHI_FORM);
  const [editingIshchiId, setEditingIshchiId] = useState<number | null>(null);
  const [showIshchiModal, setShowIshchiModal] = useState(false);

  const createIshchiMutation = useMutation({
    mutationFn: () =>
      api.post<IshchiRow>("/api/ishchilar", {
        ism: ishchiForm.ism,
        familiya: ishchiForm.familiya,
        supervayzerId: isSupervayzer ? undefined : Number(ishchiForm.supervayzerId),
        ishGaKirganSana: ishchiForm.ishGaKirganSana,
        boshlangichLiga: ishchiForm.boshlangichLiga,
        rasm: photo,
        viloyat: ishchiForm.viloyat,
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["ishchilar"] });
      toast.success(`"${created.ism} ${created.familiya}" agent sifatida qo'shildi`);
      setIshchiForm(EMPTY_ISHCHI_FORM);
      setPhoto(null);
      setShowIshchiModal(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Agentni qo'shib bo'lmadi"),
  });

  const updateIshchiMutation = useMutation({
    mutationFn: () =>
      api.put<IshchiRow>(`/api/ishchilar/${editingIshchiId}`, {
        ism: ishchiForm.ism,
        familiya: ishchiForm.familiya,
        supervayzerId: isSupervayzer ? undefined : Number(ishchiForm.supervayzerId),
        ishGaKirganSana: ishchiForm.ishGaKirganSana,
        active: ishchiForm.active,
        boshlangichLiga: ishchiForm.boshlangichLiga,
        rasm: photo,
        viloyat: ishchiForm.viloyat,
      }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["ishchilar"] });
      toast.success(`"${updated.ism} ${updated.familiya}" yangilandi`);
      setIshchiForm(EMPTY_ISHCHI_FORM);
      setEditingIshchiId(null);
      setPhoto(null);
      setShowIshchiModal(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Agentni yangilab bo'lmadi"),
  });

  const deleteIshchiMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/ishchilar/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ishchilar"] });
      toast.success("Agent o'chirildi");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Agentni o'chirib bo'lmadi"),
  });

  function startEditIshchi(s: IshchiRow) {
    setEditingIshchiId(s.id);
    setIshchiForm({
      ism: s.ism,
      familiya: s.familiya,
      supervayzerId: String(s.supervayzerId),
      ishGaKirganSana: s.ishGaKirganSana,
      active: s.active,
      boshlangichLiga: s.boshlangichLiga ?? "rising",
      viloyat: s.viloyat ?? "",
    });
    setPhoto(s.rasm ?? null);
    setPhotoStatus("idle");
    setShowIshchiModal(true);
  }

  function openCreateIshchi() {
    setEditingIshchiId(null);
    setIshchiForm(EMPTY_ISHCHI_FORM);
    setPhoto(null);
    setPhotoStatus("idle");
    setShowIshchiModal(true);
  }

  function closeIshchiModal() {
    setShowIshchiModal(false);
    setEditingIshchiId(null);
    setIshchiForm(EMPTY_ISHCHI_FORM);
    setPhoto(null);
    setPhotoStatus("idle");
  }

  // --- Oylik natija kiritish ---
  const [selectedIshchiId, setSelectedIshchiId] = useState<number | "">("");
  const [oy, setOy] = useState(todayMonthInput());
  const [natijaDraft, setNatijaDraft] = useState<Record<number, { plan: number; bajarildi: number }>>({});

  const { data: oyNatijalari = [] } = useQuery({
    queryKey: ["natijalar", oy],
    queryFn: () => api.get<NatijaRow[]>(`/api/natijalar?oy=${oy}`),
    enabled: !!oy,
  });

  useEffect(() => {
    if (!selectedIshchiId) {
      setNatijaDraft({});
      return;
    }
    const mavjud = oyNatijalari.filter((n) => n.ishchiId === selectedIshchiId);
    const draft: Record<number, { plan: number; bajarildi: number }> = {};
    for (const m of mahsulotlar) {
      const bor = mavjud.find((n) => n.mahsulotId === m.id);
      draft[m.id] = bor ? { plan: bor.plan, bajarildi: bor.bajarildi } : { plan: m.standartPlan, bajarildi: 0 };
    }
    setNatijaDraft(draft);
  }, [selectedIshchiId, oy, oyNatijalari, mahsulotlar]);

  const natijaPreview = useMemo(() => {
    const rows = Object.values(natijaDraft);
    const plan = rows.reduce((s, r) => s + r.plan, 0);
    const bajarildi = rows.reduce((s, r) => s + r.bajarildi, 0);
    return plan === 0 ? 0 : (bajarildi / plan) * 100;
  }, [natijaDraft]);

  const saveNatijaMutation = useMutation({
    mutationFn: () =>
      api.post("/api/natijalar/bulk", {
        oy,
        satrlar: Object.entries(natijaDraft).map(([mahsulotId, v]) => ({
          ishchiId: selectedIshchiId,
          mahsulotId: Number(mahsulotId),
          plan: v.plan,
          bajarildi: v.bajarildi,
        })),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["natijalar", oy] });
      toast.success("Oylik natija saqlandi");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Natijani saqlab bo'lmadi"),
  });

  // --- Ommaviy (bir nechta agent uchun bir vaqtda) natija kiritish — eski/tarixiy oylar uchun ---
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkDraft, setBulkDraft] = useState<Record<string, { plan: number; bajarildi: number }>>({});

  useEffect(() => {
    if (!showBulkModal) return;
    const draft: Record<string, { plan: number; bajarildi: number }> = {};
    for (const s of filteredIshchilar) {
      for (const m of mahsulotlar) {
        const bor = oyNatijalari.find((n) => n.ishchiId === s.id && n.mahsulotId === m.id);
        draft[`${s.id}-${m.id}`] = bor ? { plan: bor.plan, bajarildi: bor.bajarildi } : { plan: m.standartPlan, bajarildi: 0 };
      }
    }
    setBulkDraft(draft);
  }, [showBulkModal, oy, oyNatijalari, mahsulotlar, filteredIshchilar]);

  const saveBulkMutation = useMutation({
    mutationFn: () =>
      api.post("/api/natijalar/bulk", {
        oy,
        satrlar: filteredIshchilar.flatMap((s) =>
          mahsulotlar.map((m) => {
            const v = bulkDraft[`${s.id}-${m.id}`] ?? { plan: m.standartPlan, bajarildi: 0 };
            return { ishchiId: s.id, mahsulotId: m.id, plan: v.plan, bajarildi: v.bajarildi };
          }),
        ),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["natijalar", oy] });
      toast.success(`${filteredIshchilar.length} ta agent uchun natija saqlandi`);
      setShowBulkModal(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Natijalarni saqlab bo'lmadi"),
  });

  // --- Surat (kichraytirilgan holda, o'zgarishsiz saqlanadi — ishchi saqlanganda shu surat reytingda ham ko'rinadi) ---
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<"idle" | "loading" | "error">("idle");
  const photoInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoFile(file: File) {
    setPhotoStatus("loading");
    try {
      const dataUrl = await readAndResizePhoto(file);
      setPhoto(dataUrl);
      setPhotoStatus("idle");
    } catch (err) {
      setPhotoStatus("error");
      toast.error(err instanceof Error ? err.message : "Suratni qayta ishlab bo'lmadi.");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Agentlarni tizimga kiritish"
        subtitle={`${isSupervayzer ? "Supervayzer" : "Operator"} paneli · xodimlar bazasi va oylik natijalar`}
      />

      <div className="grid grid-cols-1 gap-6">
        <Reveal className="block">
          <div className="card-surface overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold">Mavjud xodimlar</h2>
                <p className="text-sm text-muted-foreground">
                  {hasActiveFilter ? `${filteredIshchilar.length} / ${ishchilar.length}` : ishchilar.length} ta agent
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ishchilar.length > 0 && mahsulotlar.length > 0 ? (
                  <button type="button" className="btn-ghost" onClick={() => setShowBulkModal(true)}>
                    <Table2 className="h-4 w-4" /> Ommaviy/tarixiy natija kiritish
                  </button>
                ) : null}
                <button type="button" className="btn-brand" onClick={openCreateIshchi}>
                  <Plus className="h-4 w-4" /> Agent qo'shish
                </button>
              </div>
            </div>
            {ishchilar.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
                {showSupervayzerFilter ? (
                  <select
                    className="field w-auto"
                    value={filterSupervayzerId}
                    onChange={(e) => setFilterSupervayzerId(e.target.value)}
                  >
                    <option value={FILTER_ALL}>Barcha supervayzerlar</option>
                    {supervayzerlar.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.ism} {s.familiya}
                      </option>
                    ))}
                  </select>
                ) : null}
                {showMenejerFilter ? (
                  <select className="field w-auto" value={filterMenejer} onChange={(e) => setFilterMenejer(e.target.value)}>
                    <option value={FILTER_ALL}>Barcha menejerlar</option>
                    {menejerlar.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : null}
                <select className="field w-auto" value={filterLiga} onChange={(e) => setFilterLiga(e.target.value)}>
                  <option value={FILTER_ALL}>Barcha ligalar</option>
                  {LEAGUES.map((l) => (
                    <option key={l.key} value={l.key}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <select className="field w-auto" value={filterViloyat} onChange={(e) => setFilterViloyat(e.target.value)}>
                  <option value={FILTER_ALL}>Barcha viloyatlar</option>
                  {VILOYATLAR.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.name}
                    </option>
                  ))}
                </select>
                {hasActiveFilter ? (
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1 text-xs"
                    onClick={() => {
                      setFilterSupervayzerId(FILTER_ALL);
                      setFilterMenejer(FILTER_ALL);
                      setFilterLiga(FILTER_ALL);
                      setFilterViloyat(FILTER_ALL);
                    }}
                  >
                    Filtrni tozalash
                  </button>
                ) : null}
              </div>
            ) : null}
            {loadingIshchilar ? (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : ishchilar.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Hali agent qo'shilmagan.</p>
            ) : filteredIshchilar.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Filtrga mos agent topilmadi.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Ism</th>
                      <th className="px-5 py-3 font-medium">Liga</th>
                      <th className="px-5 py-3 font-medium">Viloyat</th>
                      <th className="px-5 py-3 font-medium">Supervayzer</th>
                      <th className="px-5 py-3 text-right font-medium">Amal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIshchilar.map((s, i) => {
                      const league = LEAGUES.find((l) => l.key === s.boshlangichLiga);
                      return (
                      <tr
                        key={s.id}
                        className={`border-b border-white/[0.06] transition-colors duration-200 last:border-0 hover:bg-white/[0.03] ${
                          selectedIshchiId === s.id ? "bg-brand-soft/60" : ""
                        } ${s.active ? "" : "opacity-60"}`}
                        style={{ animation: `micco-rise 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 45}ms both` }}
                      >
                        <td className="px-5 py-3 font-medium">
                          <span className="flex items-center gap-3">
                            <img
                              src={s.rasm || avatarFor(`${s.ism} ${s.familiya}-${s.id}`)}
                              alt=""
                              className="h-8 w-8 shrink-0 rounded-full object-cover"
                              style={{ border: "1px solid color-mix(in oklab, white 15%, transparent)" }}
                            />
                            <span className="flex items-center gap-2">
                              {s.ism} {s.familiya}
                              {!s.active ? (
                                <span className="rounded-full bg-destructive/12 px-2 py-0.5 text-[10px] font-medium text-destructive">
                                  Faol emas
                                </span>
                              ) : null}
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {league ? (
                            <span
                              className="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                              style={{
                                borderColor: `color-mix(in oklab, ${league.accent} 40%, transparent)`,
                                backgroundColor: `color-mix(in oklab, ${league.accent} 12%, transparent)`,
                                color: league.accent,
                              }}
                            >
                              {league.name}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {VILOYATLAR.find((v) => v.key === s.viloyat)?.name ?? "—"}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{s.supervayzerFullName}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="btn-ghost px-2 py-1" onClick={() => startEditIshchi(s)}>
                              <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                            </button>
                            <button className="btn-ghost px-2 py-1" onClick={() => setSelectedIshchiId(s.id)}>
                              Natija kiritish
                            </button>
                            {canDeleteIshchi ? (
                              <button
                                className="btn-ghost px-2 py-1 text-destructive"
                                onClick={() => {
                                  if (window.confirm(`"${s.ism} ${s.familiya}"ni o'chirishga ishonchingiz komilmi?`)) {
                                    deleteIshchiMutation.mutate(s.id);
                                  }
                                }}
                                disabled={deleteIshchiMutation.isPending}
                              >
                                <Trash2 className="h-3.5 w-3.5" /> O'chirish
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {selectedIshchiId
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
              onClick={() => setSelectedIshchiId("")}
            >
              <div
                className="card-surface my-8 w-full max-w-md space-y-4 p-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Oylik natija kiritish</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ishchilar.find((s) => s.id === selectedIshchiId)?.ism}{" "}
                      {ishchilar.find((s) => s.id === selectedIshchiId)?.familiya}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1.5"
                    onClick={() => setSelectedIshchiId("")}
                    aria-label="Yopish"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Oy</label>
                  <input
                    type="month"
                    className="field w-40"
                    value={oy.slice(0, 7)}
                    onChange={(e) => setOy(`${e.target.value}-01`)}
                  />
                </div>

                {mahsulotlar.length > 0 ? (
                  <div className="rounded-xl border border-border p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Mahsulot bo'yicha plan / bajarildi
                    </p>
                    <div className="space-y-3">
                      {mahsulotlar.map((m) => (
                        <div key={m.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                          <span className="text-sm">
                            {m.nomi} <span className="text-xs text-muted-foreground">({m.birlik})</span>
                          </span>
                          <input
                            className="field w-24"
                            type="number"
                            value={natijaDraft[m.id]?.plan ?? m.standartPlan}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              setNatijaDraft((s) => ({
                                ...s,
                                [m.id]: { plan: Number(e.target.value), bajarildi: s[m.id]?.bajarildi ?? 0 },
                              }))
                            }
                          />
                          <input
                            className="field w-24"
                            type="number"
                            value={natijaDraft[m.id]?.bajarildi ?? 0}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              setNatijaDraft((s) => ({
                                ...s,
                                [m.id]: { plan: s[m.id]?.plan ?? m.standartPlan, bajarildi: Number(e.target.value) },
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">Chapdagi maydon — plan, o'ngdagi — bajarilgan miqdor.</p>
                    <div className="mt-4 flex items-center gap-4 rounded-lg bg-muted/60 p-3">
                      <Donut value={Math.round(natijaPreview * 10) / 10} size={82} stroke={8} />
                      <p className="text-xs text-muted-foreground">Umumiy foiz = jami bajarilgan / jami plan × 100.</p>
                    </div>
                    <button
                      className="btn-brand mt-4 w-full"
                      onClick={() => saveNatijaMutation.mutate()}
                      disabled={saveNatijaMutation.isPending}
                    >
                      {saveNatijaMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Natijani saqlash
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Avval Mahsulotlar bo'limida mahsulot qo'shing.</p>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}

      {showBulkModal
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
              onClick={() => setShowBulkModal(false)}
            >
              <div
                className="card-surface my-8 w-full max-w-4xl space-y-4 p-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Ommaviy/tarixiy natija kiritish</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Joriy filtrga mos {filteredIshchilar.length} ta agent uchun — istalgan (shu jumladan o'tgan)
                      oy tanlab, hammasiga bir vaqtda natija kiriting.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1.5"
                    onClick={() => setShowBulkModal(false)}
                    aria-label="Yopish"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Oy</label>
                  <input
                    type="month"
                    className="field w-40"
                    value={oy.slice(0, 7)}
                    onChange={(e) => setOy(`${e.target.value}-01`)}
                  />
                </div>

                {filteredIshchilar.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Joriy filtrga mos agent yo'q — yuqoridagi filtrlarni o'zgartiring.
                  </p>
                ) : (
                  <div className="max-h-[55vh] overflow-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="sticky top-0 z-10 border-b border-border bg-card text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="px-3 py-2 font-medium">Agent</th>
                          {mahsulotlar.map((m) => (
                            <th key={m.id} className="px-3 py-2 text-center font-medium" colSpan={2}>
                              {m.nomi} <span className="normal-case text-[10px]">({m.birlik})</span>
                            </th>
                          ))}
                        </tr>
                        <tr className="sticky top-[33px] z-10 border-b border-border bg-card text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                          <th className="px-3 py-1 font-medium"></th>
                          {mahsulotlar.map((m) => (
                            <Fragment key={m.id}>
                              <th className="px-2 py-1 text-center font-medium">Plan</th>
                              <th className="px-2 py-1 text-center font-medium">Bajarildi</th>
                            </Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredIshchilar.map((s) => (
                          <tr key={s.id} className="border-b border-white/[0.06] last:border-0">
                            <td className="whitespace-nowrap px-3 py-1.5 font-medium">
                              {s.ism} {s.familiya}
                            </td>
                            {mahsulotlar.map((m) => {
                              const key = `${s.id}-${m.id}`;
                              const v = bulkDraft[key] ?? { plan: m.standartPlan, bajarildi: 0 };
                              return (
                                <Fragment key={key}>
                                  <td className="px-1 py-1">
                                    <input
                                      className="field w-20 px-2 py-1 text-center"
                                      type="number"
                                      value={v.plan}
                                      onFocus={(e) => e.target.select()}
                                      onChange={(e) =>
                                        setBulkDraft((d) => ({
                                          ...d,
                                          [key]: { plan: Number(e.target.value), bajarildi: d[key]?.bajarildi ?? v.bajarildi },
                                        }))
                                      }
                                    />
                                  </td>
                                  <td className="px-1 py-1">
                                    <input
                                      className="field w-20 px-2 py-1 text-center"
                                      type="number"
                                      value={v.bajarildi}
                                      onFocus={(e) => e.target.select()}
                                      onChange={(e) =>
                                        setBulkDraft((d) => ({
                                          ...d,
                                          [key]: { plan: d[key]?.plan ?? v.plan, bajarildi: Number(e.target.value) },
                                        }))
                                      }
                                    />
                                  </td>
                                </Fragment>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <button
                  className="btn-brand w-full"
                  onClick={() => saveBulkMutation.mutate()}
                  disabled={saveBulkMutation.isPending || filteredIshchilar.length === 0}
                >
                  {saveBulkMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {filteredIshchilar.length} ta agent uchun saqlash
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      {showIshchiModal
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
              onClick={closeIshchiModal}
            >
              <form
                className="card-surface my-8 w-full max-w-md space-y-4 p-5"
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (editingIshchiId) updateIshchiMutation.mutate();
                  else createIshchiMutation.mutate();
                }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    {editingIshchiId ? "Agentni tahrirlash" : "Yangi agent qo'shish"}
                  </h2>
                  <button type="button" className="btn-ghost px-2 py-1.5" onClick={closeIshchiModal} aria-label="Yopish">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Surat</label>
                  <div className="flex items-center gap-4">
                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted">
                      {photoStatus === "loading" ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : photo ? (
                        <img src={photo} alt="Agent surati" className="h-full w-full object-cover" />
                      ) : (
                        <UserRound className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handlePhotoFile(file);
                        }}
                      />
                      <button type="button" className="btn-ghost" onClick={() => photoInputRef.current?.click()}>
                        {photo ? "Suratni almashtirish" : "Surat yuklash"}
                      </button>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Agent saqlanganda shu surat reytingda ham ko'rinadi.
                      </p>
                      {photoStatus === "error" ? (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-danger">
                          <ImageOff className="h-3 w-3" /> Suratni yuklab bo'lmadi — boshqasini sinab ko'ring.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Ismi</label>
                    <input
                      className="field"
                      value={ishchiForm.ism}
                      onChange={(e) => setIshchiForm((s) => ({ ...s, ism: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Familiyasi</label>
                    <input
                      className="field"
                      value={ishchiForm.familiya}
                      onChange={(e) => setIshchiForm((s) => ({ ...s, familiya: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {!isSupervayzer ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Supervayzer</label>
                    <select
                      className="field"
                      value={ishchiForm.supervayzerId}
                      onChange={(e) => setIshchiForm((s) => ({ ...s, supervayzerId: e.target.value }))}
                      required
                    >
                      <option value="">— tanlang —</option>
                      {supervayzerlar.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.ism} {s.familiya}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Ishga kirgan sana</label>
                  <input
                    className="field"
                    type="date"
                    value={ishchiForm.ishGaKirganSana}
                    onChange={(e) => setIshchiForm((s) => ({ ...s, ishGaKirganSana: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Joriy liga</label>
                  <select
                    className="field"
                    value={ishchiForm.boshlangichLiga}
                    onChange={(e) => setIshchiForm((s) => ({ ...s, boshlangichLiga: e.target.value }))}
                  >
                    {LEAGUES.map((l) => (
                      <option key={l.key} value={l.key}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground">
                    Agent shu liga ichida raqobat qiladi (masalan, tajribali xodim uchun boshqa liga tanlash
                    mumkin). Har oy yakunida Nizom qoidasi bo'yicha (top-5 yuqoriga, bottom-5 pastga) avtomatik
                    yangilanadi.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Viloyat</label>
                  <select
                    className="field"
                    value={ishchiForm.viloyat}
                    onChange={(e) => setIshchiForm((s) => ({ ...s, viloyat: e.target.value }))}
                    required
                  >
                    <option value="" disabled>
                      Viloyat tanlang
                    </option>
                    {VILOYATLAR.map((v) => (
                      <option key={v.key} value={v.key}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                {editingIshchiId ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={ishchiForm.active}
                      onChange={(e) => setIshchiForm((s) => ({ ...s, active: e.target.checked }))}
                    />
                    Faol
                  </label>
                ) : null}

                <button
                  type="submit"
                  className="btn-brand w-full"
                  disabled={createIshchiMutation.isPending || updateIshchiMutation.isPending}
                >
                  {createIshchiMutation.isPending || updateIshchiMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingIshchiId ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {editingIshchiId ? "Saqlash" : "Agentni saqlash"}
                </button>
              </form>
            </div>,
            document.body,
          )
        : null}
    </AppShell>
  );
}
