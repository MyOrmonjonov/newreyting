import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, UserPlus, UserCog, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { PasswordDialog } from "@/components/PasswordDialog";
import { Reveal, TimeFilter, type Period } from "@/components/motion";
import { api, ApiError } from "@/lib/api";
import { useAuth, type Role } from "@/lib/auth-context";

export const Route = createFileRoute("/operatorlar")({
  head: () => ({
    meta: [
      { title: "Operatorlar — login yaratish | MICCO" },
      {
        name: "description",
        content: "Operator qo'shish: ismi, familiyasi va login-parol yaratish oqimi.",
      },
      { property: "og:title", content: "MICCO operatorlar" },
      { property: "og:description", content: "Operatorlar ro'yxati va yangi operator qo'shish oqimi." },
    ],
  }),
  component: OperatorlarPage,
});

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

function OperatorlarPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<Period>("oy");
  const [date, setDate] = useState("2026-07-28");
  const [form, setForm] = useState(EMPTY_FORM);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);

  const canManage = user?.role === "ADMIN";

  const { data: operators = [], isLoading } = useQuery({
    queryKey: ["users", "operators"],
    queryFn: () => api.get<UserRow[]>("/api/users/operators"),
    enabled: canManage,
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post<UserRow>("/api/users/operators", payload),
    onSuccess: (created) => {
      void queryClient.invalidateQueries({ queryKey: ["users", "operators"] });
      toast.success(`"${created.ism} ${created.familiya}" operator sifatida qo'shildi`);
      setForm(EMPTY_FORM);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Operator qo'shib bo'lmadi");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ id, newPassword }: { id: number; newPassword: string }) =>
      api.put(`/api/users/operators/${id}/password`, { newPassword }),
    onSuccess: () => {
      toast.success("Parol yangilandi");
      setResetTarget(null);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Parolni yangilab bo'lmadi");
    },
  });

  if (!canManage) {
    return (
      <AppShell>
        <PageHeader title="Operatorlar" subtitle="Ruxsat cheklangan" />
        <div className="card-surface flex flex-col items-center gap-2 p-10 text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Bu bo'limni faqat <b>Admin</b> ko'ra oladi. Sizning rolingiz: {user?.role.toLowerCase()}.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        title="Operatorlar"
        subtitle="Operator qo'shish · login-parol yaratish oqimi"
        right={<TimeFilter value={period} onChange={setPeriod} date={date} onDate={setDate} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2 block">
          <div className="card-surface overflow-hidden">
            <div className="border-b border-border p-5">
              <h2 className="text-lg font-semibold">Operatorlar ro'yxati</h2>
              <p className="text-sm text-muted-foreground">Admin tomonidan qo'shiladi va boshqariladi</p>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center p-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : operators.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Hali operator qo'shilmagan.</p>
            ) : (
              <ul className="divide-y divide-border">
                {operators.map((o, i) => (
                  <li
                    key={o.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-accent/70"
                    style={{ animation: `micco-rise 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms both` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand">
                        <UserCog className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {o.ism} {o.familiya}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          login: {o.login}
                          {o.createdByFullName ? ` · qo'shdi: ${o.createdByFullName}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="btn-ghost" onClick={() => setResetTarget(o)}>
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
            <h2 className="text-lg font-semibold">Operator qo'shish</h2>
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
                placeholder="masalan: jasur.operator"
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
          </form>
        </Reveal>
      </div>

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
