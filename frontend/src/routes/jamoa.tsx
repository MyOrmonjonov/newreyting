import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, ShieldAlert, ShieldCheck, UserPlus, UserX, UserCheck, Pencil, Trash2, X, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { PasswordDialog } from "@/components/PasswordDialog";
import { Reveal } from "@/components/motion";
import { api, ApiError } from "@/lib/api";
import { useAuth, type Role } from "@/lib/auth-context";

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
  createdAt: string;
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
    canManage: (role) => role === "ADMIN" || role === "MENEJER",
    createdByHint: "Menejer tomonidan qo'shiladi va boshqariladi",
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
  const [editForm, setEditForm] = useState({ ism: "", familiya: "" });
  const [showCreateModal, setShowCreateModal] = useState(false);

  const availableTabs = useMemo(
    () => (["menejer", "supervayzer"] as Tab[]).filter((t) => user && TAB_CONFIG[t].canManage(user.role)),
    [user],
  );
  const [tab, setTab] = useState<Tab>(availableTabs[0] ?? "menejer");
  const config = TAB_CONFIG[tab];
  const canManageTab = user ? config.canManage(user.role) : false;
  // Menejer supervayzer qo'sha/tahrirlay/faolsizlantira oladi, lekin o'chira olmaydi (backend ham shunday cheklaydi).
  const canDelete = !(tab === "supervayzer" && user?.role === "MENEJER");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["users", tab],
    queryFn: () => api.get<UserRow[]>(config.path),
    enabled: canManageTab,
  });

  const showOwnerField = user?.role === "ADMIN";
  const ownerConfig = OWNER_CONFIG[tab];
  const { data: owners = [] } = useQuery({
    queryKey: ["users", "owners", tab],
    queryFn: () => api.get<UserRow[]>(ownerConfig.path),
    enabled: showOwnerField,
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
    mutationFn: ({ id, payload }: { id: number; payload: typeof editForm }) =>
      api.put(`${config.path}/${id}`, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users", tab] });
      toast.success("Ma'lumotlar yangilandi");
      setEditingId(null);
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
    setEditForm({ ism: r.ism, familiya: r.familiya });
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
              <button type="button" className="btn-brand capitalize" onClick={() => setShowCreateModal(true)}>
                <UserPlus className="h-4 w-4" /> {tab} qo'shish
              </button>
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
                    {editingId === r.id ? (
                      <form
                        className="flex flex-1 flex-wrap items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          updateMutation.mutate({ id: r.id, payload: editForm });
                        }}
                      >
                        <input
                          className="field w-32"
                          value={editForm.ism}
                          onChange={(e) => setEditForm((s) => ({ ...s, ism: e.target.value }))}
                          required
                        />
                        <input
                          className="field w-32"
                          value={editForm.familiya}
                          onChange={(e) => setEditForm((s) => ({ ...s, familiya: e.target.value }))}
                          required
                        />
                        <button className="btn-brand px-3 py-1.5" type="submit" disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        </button>
                        <button className="btn-ghost px-3 py-1.5" type="button" onClick={() => setEditingId(null)}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand">
                            <ShieldCheck className="h-4 w-4" />
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
                    )}
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
