import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, ShieldAlert, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Reveal, TimeFilter, type Period } from "@/components/motion";
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

const EMPTY_FORM = { ism: "", familiya: "", login: "", password: "" };

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

function TeamPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<Period>("oy");
  const [date, setDate] = useState("2026-07-28");
  const [form, setForm] = useState(EMPTY_FORM);

  const availableTabs = useMemo(
    () => (["menejer", "supervayzer"] as Tab[]).filter((t) => user && TAB_CONFIG[t].canManage(user.role)),
    [user],
  );
  const [tab, setTab] = useState<Tab>(availableTabs[0] ?? "menejer");
  const config = TAB_CONFIG[tab];
  const canManageTab = user ? config.canManage(user.role) : false;

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["users", tab],
    queryFn: () => api.get<UserRow[]>(config.path),
    enabled: canManageTab,
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post<UserRow>(config.path, payload),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["users", tab] });
      toast.success(`"${created.ism} ${created.familiya}" ${tab} sifatida qo'shildi`);
      setForm(EMPTY_FORM);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Qo'shib bo'lmadi");
    },
  });

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
        right={<TimeFilter value={period} onChange={setPeriod} date={date} onDate={setDate} />}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2 block" key={tab}>
          <div className="card-surface overflow-hidden">
            <div className="border-b border-border p-5">
              <h2 className="text-lg font-semibold capitalize">{tab}lar ro'yxati</h2>
              <p className="text-sm text-muted-foreground">{config.createdByHint}</p>
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
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-accent/70"
                    style={{ animation: `micco-rise 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms both` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {r.ism} {r.familiya}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          login: {r.login}
                          {r.createdByFullName ? ` · qo'shdi: ${r.createdByFullName}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-ghost" onClick={() => toast("Parol yangilash tez orada")}>
                        <KeyRound className="h-3.5 w-3.5" /> Parolni yangilash
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>

        <Reveal delay={90} className="block">
          <form
            className="card-surface space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(form);
            }}
          >
            <h2 className="text-lg font-semibold capitalize">Yangi {tab}</h2>
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
            <button className="btn-brand w-full" type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Yaratish va login berish
            </button>
            <p className="text-[11px] text-muted-foreground">
              Eslatma: ishchi (agent) uchun login yaratilmaydi — u faqat ochiq reyting sahifasini ko'radi.
            </p>
          </form>
        </Reveal>
      </div>
    </AppShell>
  );
}
