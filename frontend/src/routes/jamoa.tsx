import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ImageOff,
  KeyRound,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Table2,
  UserPlus,
  UserX,
  UserCheck,
  UserRound,
  Pencil,
  Trash2,
  X,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { PasswordDialog } from "@/components/PasswordDialog";
import { Reveal } from "@/components/motion";
import { api, ApiError } from "@/lib/api";
import { useAuth, type Role } from "@/lib/auth-context";
import { readAndResizePhoto } from "@/lib/photo";
import { clearDraft, loadDraft, saveDraft } from "@/lib/draft-storage";

export const Route = createFileRoute("/jamoa")({
  head: () => ({
    meta: [
      { title: "Menejer va supervayzer qo'shish — login yaratish | MICCO" },
      {
        name: "description",
        content:
          "Operator menejer, menejer esa supervayzer qo'shadi: login-parol yaratish oqimi va huquqlar boshqaruvi.",
      },
      { property: "og:title", content: "MICCO jamoa boshqaruvi" },
      { property: "og:description", content: "Rollar ierarxiyasi bo'yicha akkaunt yaratish oqimi." },
    ],
  }),
  component: TeamPage,
});

type Tab = "menejer" | "supervayzer";

type UserRow = {
  id: number;
  ism: string;
  familiya: string;
  login: string;
  role: Role;
  active: boolean;
  createdByFullName: string | null;
  createdById: number | null;
  createdAt: string;
  rasm: string | null;
};

const EMPTY_FORM = { ism: "", familiya: "", login: "", password: "", ownerId: "" };

const TAB_CONFIG: Record<Tab, { path: string; canManage: (role: Role) => boolean; createdByHint: string }> = {
  menejer: {
    path: "/api/users/menejers",
    canManage: (role) => role === "ADMIN" || role === "OPERATOR",
    createdByHint: "Operator tomonidan qo'shiladi va boshqariladi",
  },
  supervayzer: {
    path: "/api/users/supervayzers",
    canManage: (role) => role === "ADMIN" || role === "MENEJER" || role === "OPERATOR",
    createdByHint: "Menejer yoki Operator tomonidan qo'shiladi va boshqariladi",
  },
};

// ADMIN har qanday rolni to'g'ridan-to'g'ri yaratishi mumkin, lekin shu holatda kimga
// tegishli ekanini (operator/menejer) tanlashi shart — aks holda yaratilgan hisob hech
// qaysi menejer/operatorning ro'yxatida ko'rinmay, "egasiz" qolib ketadi.
const OWNER_CONFIG: Record<Tab, { path: string; label: string }> = {
  menejer: { path: "/api/users/operators", label: "Operator" },
  supervayzer: { path: "/api/users/menejers", label: "Menejer" },
};

function TeamPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ ism: "", familiya: "", login: "", ownerId: "" });
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [editPhotoStatus, setEditPhotoStatus] = useState<"idle" | "loading" | "error">("idle");
  const editPhotoInputRef = useRef<HTMLInputElement>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // --- Tarixiy (tizimdan oldingi) oylar uchun qo'lda ball/foiz kiritish — menejer/supervayzerning
  // o'zi uchun, agentlar natijasidan qat'iy nazar (RahbarOylikNatija — RatingService'da bundan
  // ustun qo'yiladi, yangi oylar hamon agentlardan avtomatik hisoblanadi).
  const [showHistModal, setShowHistModal] = useState(false);
  const [histOy, setHistOy] = useState(`${new Date().toISOString().slice(0, 7)}-01`);
  const [histDraft, setHistDraft] = useState<Record<string, { percent: number; ball: number }>>({});

  async function handleEditPhotoFile(file: File) {
    setEditPhotoStatus("loading");
    try {
      setEditPhoto(await readAndResizePhoto(file));
      setEditPhotoStatus("idle");
    } catch {
      setEditPhotoStatus("error");
    }
  }

  const availableTabs = useMemo(
    () => (["menejer", "supervayzer"] as Tab[]).filter((t) => user && TAB_CONFIG[t].canManage(user.role)),
    [user],
  );
  const [tab, setTab] = useState<Tab>(availableTabs[0] ?? "menejer");
  const config = TAB_CONFIG[tab];
  const canManageTab = user ? config.canManage(user.role) : false;
  // Menejer va Operator supervayzer qo'sha/tahrirlay/faolsizlantira oladi, lekin o'chira olmaydi
  // (faqat ADMIN o'chira oladi — backend ham shunday cheklaydi).
  const canDelete = !(tab === "supervayzer" && (user?.role === "MENEJER" || user?.role === "OPERATOR"));

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["users", tab],
    queryFn: () => api.get<UserRow[]>(config.path),
    enabled: canManageTab,
  });

  // Menejer uchun ega tanlash yo'q — bitta umumiy operatorga avtomatik biriktiriladi
  // (backend'da resolveOwner/soleOperator). Faqat supervayzer uchun (bir nechta menejer
  // bo'lishi mumkinligi sababli) ADMIN yoki OPERATOR ega (menejer) tanlashi kerak.
  const showOwnerField = (user?.role === "ADMIN" || user?.role === "OPERATOR") && tab === "supervayzer";
  const ownerConfig = OWNER_CONFIG[tab];
  const { data: owners = [] } = useQuery({
    queryKey: ["users", "owners", tab],
    queryFn: () => api.get<UserRow[]>(ownerConfig.path),
    enabled: showOwnerField,
  });

  type RahbarNatijaRow = { userId: number; percent: number; ball: number };
  const {
    data: histRows = [],
    isFetched: histFetched,
  } = useQuery({
    queryKey: ["rahbar-natija", histOy],
    queryFn: () => api.get<RahbarNatijaRow[]>(`/api/rahbar-natija?oy=${histOy}`),
    enabled: showHistModal,
  });

  // Modal ochilgan/oy almashgan har safar FAQAT BIR MARTA serverdan kelgan qiymat bilan
  // to'ldiriladi (histInitializedRef orqali) — aks holda fon rejimidagi background refetch
  // (masalan boshqa oyna/tab'ga o'tib qaytganda) hali saqlanmagan kiritilgan qiymatlarni
  // nolga qaytarib yuborardi.
  const histInitializedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!showHistModal) {
      histInitializedRef.current = null;
      return;
    }
    if (!histFetched) return;
    const key = `${tab}-${histOy}`;
    if (histInitializedRef.current === key) return;
    const draft: Record<string, { percent: number; ball: number }> = {};
    for (const r of rows) {
      const bor = histRows.find((h) => h.userId === r.id);
      draft[String(r.id)] = bor ? { percent: bor.percent, ball: bor.ball } : { percent: 0, ball: 0 };
    }
    setHistDraft(draft);
    histInitializedRef.current = key;
  }, [showHistModal, histOy, tab, histFetched, histRows, rows]);

  // Sahifa refresh qilinsa ham hali saqlanmagan tarixiy ball/foiz qoralamasi yo'qolmasin
  // uchun localStorage'da saqlanadi — faqat X tugmasi/backdrop bosilganda yoki muvaffaqiyatli
  // saqlangandan keyin (closeHistModal) tozalanadi.
  function histDraftKey(t: Tab) {
    return `micco:hist-natija:${t}`;
  }

  useEffect(() => {
    const saved = loadDraft<{ oy: string; draft: Record<string, { percent: number; ball: number }> }>(
      histDraftKey(tab),
    );
    if (saved) {
      setHistOy(saved.oy);
      setHistDraft(saved.draft);
      setShowHistModal(true);
      histInitializedRef.current = `${tab}-${saved.oy}`;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showHistModal) return;
    saveDraft(histDraftKey(tab), { oy: histOy, draft: histDraft });
  }, [showHistModal, tab, histOy, histDraft]);

  function closeHistModal() {
    clearDraft(histDraftKey(tab));
    setShowHistModal(false);
  }

  const saveHistMutation = useMutation({
    mutationFn: () =>
      api.post("/api/rahbar-natija/bulk", {
        oy: histOy,
        satrlar: rows.map((r) => {
          const v = histDraft[String(r.id)] ?? { percent: 0, ball: 0 };
          return { userId: r.id, percent: v.percent, ball: v.ball };
        }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rahbar-natija", histOy] });
      toast.success(`${rows.length} ta ${tab} uchun tarixiy natija saqlandi`);
      closeHistModal();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Saqlab bo'lmadi"),
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      api.post<UserRow>(config.path, {
        ism: payload.ism,
        familiya: payload.familiya,
        login: payload.login,
        password: payload.password,
        ownerId: showOwnerField && payload.ownerId ? Number(payload.ownerId) : undefined,
      }),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["users", tab] });
      toast.success(`"${created.ism} ${created.familiya}" ${tab} sifatida qo'shildi`);
      setForm(EMPTY_FORM);
      setShowCreateModal(false);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Qo'shib bo'lmadi");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) =>
      api.put(`${config.path}/${id}/password`, { newPassword }),
    onSuccess: () => {
      toast.success("Parol yangilandi");
      setResetTarget(null);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Parolni yangilab bo'lmadi");
    },
  });

  const setActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      api.put(`${config.path}/${id}/active`, { active }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["users", tab] });
      toast.success(variables.active ? "Faollashtirildi" : "Faolsizlantirildi");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Holatni o'zgartirib bo'lmadi");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: typeof editForm & { rasm: string | null } }) =>
      api.put(`${config.path}/${id}`, {
        ism: payload.ism,
        familiya: payload.familiya,
        login: payload.login,
        rasm: payload.rasm,
        ownerId: showOwnerField && payload.ownerId ? Number(payload.ownerId) : undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users", tab] });
      toast.success("Ma'lumotlar yangilandi");
      closeEdit();
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Yangilab bo'lmadi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`${config.path}/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users", tab] });
      toast.success("O'chirildi");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "O'chirib bo'lmadi"),
  });

  function startEdit(r: UserRow) {
    setEditingId(r.id);
    setEditForm({ ism: r.ism, familiya: r.familiya, login: r.login, ownerId: r.createdById ? String(r.createdById) : "" });
    setEditPhoto(r.rasm ?? null);
    setEditPhotoStatus("idle");
  }

  function closeEdit() {
    setEditingId(null);
    setEditForm({ ism: "", familiya: "", login: "", ownerId: "" });
    setEditPhoto(null);
    setEditPhotoStatus("idle");
  }

  if (availableTabs.length === 0) {
    return (
      <AppShell>
        <PageHeader title="Menejer / Supervayzer" subtitle="Ruxsat cheklangan" />
        <div className="card-surface flex flex-col items-center gap-2 p-10 text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Bu bo'limni sizning rolingiz ({user?.role.toLowerCase()}) uchun ko'rish/boshqarish ruxsati yo'q.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Menejer / Supervayzer qo'shish"
        subtitle="Login-parol yaratish oqimi bilan · rol ierarxiyasi hurmat qilinadi"
      />

      <div className="mb-6 inline-flex rounded-xl border border-border bg-card p-1">
        {availableTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all duration-300 ${
              tab === t ? "bg-brand text-brand-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}lar
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Reveal className="block" key={tab}>
          <div className="card-surface overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold capitalize">{tab}lar ro'yxati</h2>
                <p className="text-sm text-muted-foreground">{config.createdByHint}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {rows.length > 0 ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-warning px-4 py-2 text-sm font-semibold text-black shadow-sm transition-colors hover:opacity-90"
                    onClick={() => setShowHistModal(true)}
                  >
                    <Table2 className="h-4 w-4" /> Tarixiy ball/foiz kiritish
                  </button>
                ) : null}
                <button type="button" className="btn-brand capitalize" onClick={() => setShowCreateModal(true)}>
                  <UserPlus className="h-4 w-4" /> {tab} qo'shish
                </button>
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : rows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Hali hech kim qo'shilmagan.</p>
            ) : (
              <ul className="divide-y divide-border">
                {rows.map((r, i) => (
                  <li
                    key={r.id}
                    className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-accent/70 ${
                      r.active ? "" : "opacity-60"
                    }`}
                    style={{ animation: `micco-rise 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms both` }}
                  >
                    <>
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-soft text-brand">
                            {r.rasm ? (
                              <img src={r.rasm} alt={`${r.ism} ${r.familiya}`} className="h-full w-full object-cover" />
                            ) : (
                              <ShieldCheck className="h-4 w-4" />
                            )}
                          </div>
                          <div>
                            <p className="flex items-center gap-2 text-sm font-medium">
                              {r.ism} {r.familiya}
                              {!r.active ? (
                                <span className="rounded-full bg-destructive/12 px-2 py-0.5 text-[10px] font-medium text-destructive">
                                  Faol emas
                                </span>
                              ) : null}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              login: {r.login}
                              {r.createdByFullName ? ` · qo'shdi: ${r.createdByFullName}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <button className="btn-ghost" onClick={() => startEdit(r)}>
                            <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                          </button>
                          <button className="btn-ghost" onClick={() => setResetTarget(r)}>
                            <KeyRound className="h-3.5 w-3.5" /> Parolni yangilash
                          </button>
                          <button
                            className={`btn-ghost ${r.active ? "text-destructive" : ""}`}
                            onClick={() => setActiveMutation.mutate({ id: r.id, active: !r.active })}
                            disabled={setActiveMutation.isPending}
                          >
                            {r.active ? (
                              <>
                                <UserX className="h-3.5 w-3.5" /> Faolsizlantirish
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" /> Faollashtirish
                              </>
                            )}
                          </button>
                          {canDelete ? (
                            <button
                              className="btn-ghost text-destructive"
                              onClick={() => {
                                if (window.confirm(`"${r.ism} ${r.familiya}"ni butunlay o'chirishga ishonchingiz komilmi?`)) {
                                  deleteMutation.mutate(r.id);
                                }
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-3.5 w-3.5" /> O'chirish
                            </button>
                          ) : null}
                        </div>
                      </>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>

      </div>

      {showCreateModal
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
              onClick={() => setShowCreateModal(false)}
            >
              <form
                className="card-surface my-8 w-full max-w-sm space-y-4 p-5"
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => {
                  e.preventDefault();
                  createMutation.mutate(form);
                }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold capitalize">Yangi {tab}</h2>
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1.5"
                    onClick={() => setShowCreateModal(false)}
                    aria-label="Yopish"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Ismi</label>
                  <input
                    className="field"
                    placeholder="Ism"
                    value={form.ism}
                    onChange={(e) => setForm((s) => ({ ...s, ism: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Familiyasi</label>
                  <input
                    className="field"
                    placeholder="Familiya"
                    value={form.familiya}
                    onChange={(e) => setForm((s) => ({ ...s, familiya: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Login</label>
                  <input
                    className="field"
                    placeholder={`masalan: ism.${tab}`}
                    value={form.login}
                    onChange={(e) => setForm((s) => ({ ...s, login: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Parol</label>
                  <input
                    className="field"
                    type="password"
                    placeholder="Kamida 6 belgi"
                    value={form.password}
                    onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                    minLength={6}
                    required
                  />
                </div>
                {showOwnerField ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      {ownerConfig.label}ga biriktirish
                    </label>
                    <select
                      className="field"
                      value={form.ownerId}
                      onChange={(e) => setForm((s) => ({ ...s, ownerId: e.target.value }))}
                      required
                    >
                      <option value="" disabled>
                        {ownerConfig.label} tanlang
                      </option>
                      {owners.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.ism} {o.familiya}
                        </option>
                      ))}
                    </select>
                    {owners.length === 0 ? (
                      <p className="text-[11px] text-danger">
                        Avval kamida bitta {ownerConfig.label.toLowerCase()} qo'shilgan bo'lishi kerak.
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <button
                  className="btn-brand w-full"
                  type="submit"
                  disabled={createMutation.isPending || (showOwnerField && owners.length === 0)}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Yaratish va login berish
                </button>
                <p className="text-[11px] text-muted-foreground">
                  Eslatma: agent uchun login yaratilmaydi — u faqat ochiq reyting sahifasini ko'radi.
                </p>
              </form>
            </div>,
            document.body,
          )
        : null}

      {showHistModal
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
              onClick={closeHistModal}
            >
              <div
                className="card-surface my-8 w-full max-w-2xl space-y-4 p-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold capitalize">Tarixiy ball/foiz kiritish — {tab}lar</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Tizimdan oldingi (eski) oylar uchun — bu {tab}ning o'zi uchun ball va foiz to'g'ridan-to'g'ri
                      kiritiladi (agentlar natijasidan hisoblanmaydi). Yangi/joriy oylar hamon avvalgidek — agentlar
                      natijasidan avtomatik hisoblanadi.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost px-2 py-1.5"
                    onClick={closeHistModal}
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
                    value={histOy.slice(0, 7)}
                    onChange={(e) => setHistOy(`${e.target.value}-01`)}
                  />
                </div>

                {rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Hali {tab} qo'shilmagan.</p>
                ) : (
                  <div className="max-h-[55vh] overflow-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-card">
                        <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="px-3 py-2 font-medium">{tab === "menejer" ? "Menejer" : "Supervayzer"}</th>
                          <th className="px-2 py-2 text-center font-medium">Foiz (%)</th>
                          <th className="px-2 py-2 text-center font-medium">Ball</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => {
                          const v = histDraft[String(r.id)] ?? { percent: 0, ball: 0 };
                          return (
                            <tr key={r.id} className="border-b border-white/[0.06] last:border-0">
                              <td className="whitespace-nowrap px-3 py-1.5 font-medium">
                                {r.ism} {r.familiya}
                              </td>
                              <td className="px-1 py-1">
                                <input
                                  className="field w-24 px-2 py-1 text-center"
                                  type="number"
                                  step="0.1"
                                  value={v.percent}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) =>
                                    setHistDraft((d) => ({
                                      ...d,
                                      [String(r.id)]: { percent: Number(e.target.value), ball: d[String(r.id)]?.ball ?? v.ball },
                                    }))
                                  }
                                />
                              </td>
                              <td className="px-1 py-1">
                                <input
                                  className="field w-20 px-2 py-1 text-center"
                                  type="number"
                                  value={v.ball}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) =>
                                    setHistDraft((d) => ({
                                      ...d,
                                      [String(r.id)]: { percent: d[String(r.id)]?.percent ?? v.percent, ball: Number(e.target.value) },
                                    }))
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <button
                  className="btn-brand w-full"
                  onClick={() => saveHistMutation.mutate()}
                  disabled={saveHistMutation.isPending || rows.length === 0}
                >
                  {saveHistMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {rows.length} ta {tab} uchun saqlash
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}

      {editingId !== null
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
              onClick={closeEdit}
            >
              <form
                className="card-surface my-8 w-full max-w-sm space-y-4 p-5"
                onClick={(e) => e.stopPropagation()}
                onSubmit={(e) => {
                  e.preventDefault();
                  updateMutation.mutate({ id: editingId, payload: { ...editForm, rasm: editPhoto } });
                }}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold capitalize">{tab}ni tahrirlash</h2>
                  <button type="button" className="btn-ghost px-2 py-1.5" onClick={closeEdit} aria-label="Yopish">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Surat</label>
                  <div className="flex items-center gap-4">
                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted">
                      {editPhotoStatus === "loading" ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : editPhoto ? (
                        <img src={editPhoto} alt="Surat" className="h-full w-full object-cover" />
                      ) : (
                        <UserRound className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        ref={editPhotoInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleEditPhotoFile(file);
                        }}
                      />
                      <button type="button" className="btn-ghost" onClick={() => editPhotoInputRef.current?.click()}>
                        {editPhoto ? "Suratni almashtirish" : "Surat yuklash"}
                      </button>
                      {editPhotoStatus === "error" ? (
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-danger">
                          <ImageOff className="h-3 w-3" /> Suratni yuklab bo'lmadi — boshqasini sinab ko'ring.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Ismi</label>
                  <input
                    className="field"
                    placeholder="Ism"
                    value={editForm.ism}
                    onChange={(e) => setEditForm((s) => ({ ...s, ism: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Familiyasi</label>
                  <input
                    className="field"
                    placeholder="Familiya"
                    value={editForm.familiya}
                    onChange={(e) => setEditForm((s) => ({ ...s, familiya: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Login</label>
                  <input
                    className="field"
                    placeholder="Login"
                    value={editForm.login}
                    onChange={(e) => setEditForm((s) => ({ ...s, login: e.target.value }))}
                    required
                  />
                </div>
                {showOwnerField ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">
                      {ownerConfig.label}ga biriktirish
                    </label>
                    <select
                      className="field"
                      value={editForm.ownerId}
                      onChange={(e) => setEditForm((s) => ({ ...s, ownerId: e.target.value }))}
                      required
                    >
                      <option value="" disabled>
                        {ownerConfig.label} tanlang
                      </option>
                      {owners.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.ism} {o.familiya}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <button className="btn-brand w-full" type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Saqlash
                </button>
              </form>
            </div>,
            document.body,
          )
        : null}

      {resetTarget ? (
        <PasswordDialog
          title="Parolni yangilash"
          description={`${resetTarget.ism} ${resetTarget.familiya} (${resetTarget.login}) uchun yangi parol`}
          submitting={resetPasswordMutation.isPending}
          onClose={() => setResetTarget(null)}
          onSubmit={({ newPassword }) =>
            resetPasswordMutation.mutate({ id: resetTarget.id, newPassword })
          }
        />
      ) : null}
    </AppShell>
  );
}
