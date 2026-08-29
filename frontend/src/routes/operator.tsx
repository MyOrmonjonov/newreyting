import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageOff, Loader2, Pencil, Plus, Save, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Donut, Reveal } from "@/components/motion";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { cutoutPersonFromImage, warmUpSegmenter } from "@/lib/bg-removal";

export const Route = createFileRoute("/operator")({
  head: () => ({
    meta: [
      { title: "Operator paneli — ishchilarni tizimga kiritish | MICCO" },
      {
        name: "description",
        content: "Ishchilarni qo'shish, supervayzer biriktirish va mahsulot bo'yicha oylik natija kiritish.",
      },
      { property: "og:title", content: "MICCO Operator paneli" },
      { property: "og:description", content: "Xodimlar jadvali, yangi ishchi qo'shish va oylik natija oqimi." },
    ],
  }),
  component: OperatorPage,
});

type IshchiRow = {
  id: number;
  ism: string;
  familiya: string;
  filialId: number;
  filialNomi: string;
  supervayzerId: number;
  supervayzerFullName: string;
  ishGaKirganSana: string;
  active: boolean;
};

type FilialRow = { id: number; nomi: string };
type MahsulotRow = { id: number; nomi: string; birlik: string; standartPlan: number };
type SupervayzerRow = { id: number; ism: string; familiya: string };
type NatijaRow = { ishchiId: number; mahsulotId: number; plan: number; bajarildi: number };

const EMPTY_ISHCHI_FORM = { ism: "", familiya: "", filialId: "", supervayzerId: "", ishGaKirganSana: "", active: true };

function todayMonthInput(): string {
  return new Date().toISOString().slice(0, 7) + "-01";
}

function OperatorPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isSupervayzer = user?.role === "SUPERVAYZER";

  const { data: ishchilar = [], isLoading: loadingIshchilar } = useQuery({
    queryKey: ["ishchilar"],
    queryFn: () => api.get<IshchiRow[]>("/api/ishchilar"),
  });
  const { data: filiallar = [] } = useQuery({
    queryKey: ["filiallar"],
    queryFn: () => api.get<FilialRow[]>("/api/filiallar"),
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

  // --- Yangi ishchi qo'shish / tahrirlash ---
  const [ishchiForm, setIshchiForm] = useState(EMPTY_ISHCHI_FORM);
  const [editingIshchiId, setEditingIshchiId] = useState<number | null>(null);

  const createIshchiMutation = useMutation({
    mutationFn: () =>
      api.post<IshchiRow>("/api/ishchilar", {
        ism: ishchiForm.ism,
        familiya: ishchiForm.familiya,
        filialId: Number(ishchiForm.filialId),
        supervayzerId: isSupervayzer ? undefined : Number(ishchiForm.supervayzerId),
        ishGaKirganSana: ishchiForm.ishGaKirganSana,
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["ishchilar"] });
      toast.success(`"${created.ism} ${created.familiya}" ishchi sifatida qo'shildi`);
      setIshchiForm(EMPTY_ISHCHI_FORM);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Ishchini qo'shib bo'lmadi"),
  });

  const updateIshchiMutation = useMutation({
    mutationFn: () =>
      api.put<IshchiRow>(`/api/ishchilar/${editingIshchiId}`, {
        ism: ishchiForm.ism,
        familiya: ishchiForm.familiya,
        filialId: Number(ishchiForm.filialId),
        supervayzerId: isSupervayzer ? undefined : Number(ishchiForm.supervayzerId),
        ishGaKirganSana: ishchiForm.ishGaKirganSana,
        active: ishchiForm.active,
      }),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({ queryKey: ["ishchilar"] });
      toast.success(`"${updated.ism} ${updated.familiya}" yangilandi`);
      setIshchiForm(EMPTY_ISHCHI_FORM);
      setEditingIshchiId(null);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Ishchini yangilab bo'lmadi"),
  });

  function startEditIshchi(s: IshchiRow) {
    setEditingIshchiId(s.id);
    setIshchiForm({
      ism: s.ism,
      familiya: s.familiya,
      filialId: String(s.filialId),
      supervayzerId: String(s.supervayzerId),
      ishGaKirganSana: s.ishGaKirganSana,
      active: s.active,
    });
  }

  function cancelEditIshchi() {
    setEditingIshchiId(null);
    setIshchiForm(EMPTY_ISHCHI_FORM);
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

  // --- Surat (fon avtomatik olib tashlanadi) — hozircha faqat lokal ko'rinish, saqlanmaydi ---
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<"idle" | "loading" | "error">("idle");
  const photoInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoFile(file: File) {
    setPhotoStatus("loading");
    try {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.src = url;
      await image.decode();
      const cutout = await cutoutPersonFromImage(image);
      setPhoto(cutout.dataUrl);
      setPhotoStatus("idle");
      URL.revokeObjectURL(url);
    } catch (err) {
      setPhotoStatus("error");
      toast.error(err instanceof Error ? err.message : "Suratni qayta ishlab bo'lmadi.");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Ishchilarni tizimga kiritish"
        subtitle={`${isSupervayzer ? "Supervayzer" : "Operator"} paneli · xodimlar bazasi va oylik natijalar`}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Reveal className="xl:col-span-2 block">
          <div className="card-surface overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold">Mavjud xodimlar</h2>
                <p className="text-sm text-muted-foreground">{ishchilar.length} ta ishchi</p>
              </div>
            </div>
            {loadingIshchilar ? (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : ishchilar.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Hali ishchi qo'shilmagan.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-5 py-3 font-medium">Ism</th>
                      <th className="px-5 py-3 font-medium">Filial</th>
                      <th className="px-5 py-3 font-medium">Supervayzer</th>
                      <th className="px-5 py-3 text-right font-medium">Amal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ishchilar.map((s, i) => (
                      <tr
                        key={s.id}
                        className={`border-b border-border/70 transition-colors duration-200 last:border-0 hover:bg-accent/70 ${
                          selectedIshchiId === s.id ? "bg-brand-soft/60" : ""
                        } ${s.active ? "" : "opacity-60"}`}
                        style={{ animation: `micco-rise 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 45}ms both` }}
                      >
                        <td className="px-5 py-3 font-medium">
                          <span className="flex items-center gap-2">
                            {s.ism} {s.familiya}
                            {!s.active ? (
                              <span className="rounded-full bg-destructive/12 px-2 py-0.5 text-[10px] font-medium text-destructive">
                                Faol emas
                              </span>
                            ) : null}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{s.filialNomi}</td>
                        <td className="px-5 py-3 text-muted-foreground">{s.supervayzerFullName}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="btn-ghost px-2 py-1" onClick={() => startEditIshchi(s)}>
                              <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                            </button>
                            <button className="btn-ghost px-2 py-1" onClick={() => setSelectedIshchiId(s.id)}>
                              Natija kiritish
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Reveal delay={60} className="mt-6 block">
            <div className="card-surface space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Oylik natija kiritish</h2>
                <input
                  type="month"
                  className="field w-40"
                  value={oy.slice(0, 7)}
                  onChange={(e) => setOy(`${e.target.value}-01`)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Ishchi</label>
                <select
                  className="field"
                  value={selectedIshchiId}
                  onChange={(e) => setSelectedIshchiId(e.target.value ? Number(e.target.value) : "")}
                >
                  <option value="">— tanlang —</option>
                  {ishchilar.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.ism} {s.familiya} ({s.filialNomi})
                    </option>
                  ))}
                </select>
              </div>

              {selectedIshchiId && mahsulotlar.length > 0 ? (
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
              ) : selectedIshchiId ? (
                <p className="text-sm text-muted-foreground">Avval Mahsulotlar bo'limida mahsulot qo'shing.</p>
              ) : null}
            </div>
          </Reveal>
        </Reveal>

        <Reveal delay={100} className="block">
          <form
            className="card-surface space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (editingIshchiId) updateIshchiMutation.mutate();
              else createIshchiMutation.mutate();
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editingIshchiId ? "Ishchini tahrirlash" : "Yangi ishchi qo'shish"}</h2>
              {editingIshchiId ? (
                <button type="button" className="btn-ghost px-2 py-1" onClick={cancelEditIshchi}>
                  <X className="h-3.5 w-3.5" /> Bekor qilish
                </button>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Surat</label>
              <div className="flex items-center gap-4">
                <div
                  className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted"
                  style={
                    photo
                      ? { background: "linear-gradient(140deg, var(--race-red), var(--race-red-deep))" }
                      : undefined
                  }
                >
                  {photoStatus === "loading" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : photo ? (
                    <img src={photo} alt="Ishchi surati" className="cutout-avatar h-full w-full" />
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
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      warmUpSegmenter();
                      photoInputRef.current?.click();
                    }}
                  >
                    {photo ? "Suratni almashtirish" : "Surat yuklash"}
                  </button>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Fon avtomatik olib tashlanadi (hozircha faqat ko'rinish uchun — saqlanmaydi).
                  </p>
                  {photoStatus === "error" ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-danger">
                      <ImageOff className="h-3 w-3" /> Rasmda odam topilmadi — boshqasini sinab ko'ring.
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

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Filial</label>
              <select
                className="field"
                value={ishchiForm.filialId}
                onChange={(e) => setIshchiForm((s) => ({ ...s, filialId: e.target.value }))}
                required
              >
                <option value="">— tanlang —</option>
                {filiallar.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nomi}
                  </option>
                ))}
              </select>
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
              {editingIshchiId ? "Saqlash" : "Ishchini saqlash"}
            </button>
          </form>
        </Reveal>
      </div>
    </AppShell>
  );
}
