import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  UserCog,
  UserPlus,
  Package,
  ScrollText,
  Trophy,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  KeyRound,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { api, ApiError } from "@/lib/api";
import { PasswordDialog } from "@/components/PasswordDialog";

const NAV = [
  { group: "Boshqaruv", items: [
    { to: "/", label: "Bosh dashboard", icon: LayoutDashboard },
    { to: "/operator", label: "Agentlarni kiritish", icon: Users },
    { to: "/operatorlar", label: "Operatorlar", icon: UserPlus },
    { to: "/jamoa", label: "Menejer / Supervayzer", icon: UserCog },
    { to: "/mahsulotlar", label: "Mahsulotlar", icon: Package },
    { to: "/audit", label: "Audit log", icon: ScrollText },
  ]},
  { group: "Reytinglar", items: [
    { to: "/reyting/ishchi", label: "Agent reytingi", icon: Trophy },
    { to: "/reyting/supervayzer", label: "Supervayzer reytingi", icon: ShieldCheck },
    { to: "/reyting/menejer", label: "Menejer reytingi", icon: UserCog },
  ]},
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      void navigate({ to: "/login" });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{
          transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          background: "linear-gradient(180deg, color-mix(in oklab, white 3%, var(--color-background)), var(--color-background))",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm font-bold text-brand-foreground"
            style={{ background: "var(--color-brand)", boxShadow: "0 0 20px -4px var(--color-brand)" }}
          >
            M
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">MICCO</p>
            <p className="text-[11px] text-muted-foreground">Boshqaruv va Reyting</p>
          </div>
        </div>
        <nav className="space-y-6 p-3">
          {NAV.map((g) => (
            <div key={g.group}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {g.group}
              </p>
              <div className="space-y-1">
                {g.items.map((it) => {
                  const active = pathname === it.to;
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300",
                        active ? "text-brand" : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                      )}
                      style={
                        active
                          ? {
                              backgroundColor: "color-mix(in oklab, var(--color-brand) 14%, transparent)",
                              boxShadow: "0 0 0 1px color-mix(in oklab, var(--color-brand) 30%, transparent) inset",
                            }
                          : undefined
                      }
                    >
                      {active ? (
                        <span
                          className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full"
                          style={{ backgroundColor: "var(--color-brand)", boxShadow: "0 0 10px var(--color-brand)" }}
                        />
                      ) : null}
                      <it.icon
                        className={cn(
                          "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                          active && "text-brand",
                        )}
                      />
                      {it.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div
          className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-xl border border-white/10 p-3"
          style={{ backgroundColor: "color-mix(in oklab, white 4%, transparent)" }}
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold">
              {user.ism} {user.familiya}
            </p>
            <p className="text-[11px] text-muted-foreground">{user.login}</p>
          </div>
          <button
            onClick={() => setShowPasswordDialog(true)}
            aria-label="Parolni almashtirish"
            className="btn-ghost px-2 py-1.5"
          >
            <KeyRound className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              logout();
              void navigate({ to: "/login" });
            }}
            aria-label="Chiqish"
            className="btn-ghost px-2 py-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </aside>

      {showPasswordDialog ? (
        <PasswordDialog
          title="Parolni almashtirish"
          description="O'zingizning login parolingizni yangilash"
          requireOldPassword
          submitting={changingPassword}
          onClose={() => setShowPasswordDialog(false)}
          onSubmit={({ oldPassword, newPassword }) => {
            setChangingPassword(true);
            api
              .post("/api/auth/change-password", { oldPassword, newPassword })
              .then(() => {
                toast.success("Parol muvaffaqiyatli almashtirildi");
                setShowPasswordDialog(false);
              })
              .catch((err) => {
                toast.error(err instanceof ApiError ? err.message : "Parolni almashtirib bo'lmadi");
              })
              .finally(() => setChangingPassword(false));
          }}
        />
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur lg:px-8">
          <button className="btn-ghost lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menyu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <p className="hidden text-sm text-muted-foreground lg:block">
            Mavsum: <span className="font-medium text-foreground">2026 · Iyul</span>
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-border px-3 py-1 text-xs capitalize text-muted-foreground sm:inline">
              Rol: {user.role.toLowerCase()}
            </span>
            <div className="h-8 w-8 rounded-full bg-brand/15 ring-1 ring-brand/30" />
          </div>
        </header>
        <main key={pathname} className="page-enter px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      ) : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="page-enter">
        <h1 className="text-2xl font-semibold lg:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}
