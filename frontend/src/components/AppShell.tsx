import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { group: "Boshqaruv", items: [
    { to: "/", label: "Bosh dashboard", icon: LayoutDashboard },
    { to: "/operator", label: "Ishchilarni kiritish", icon: Users },
    { to: "/operatorlar", label: "Operatorlar", icon: UserPlus },
    { to: "/jamoa", label: "Menejer / Supervayzer", icon: UserCog },
    { to: "/mahsulotlar", label: "Mahsulotlar", icon: Package },
    { to: "/audit", label: "Audit log", icon: ScrollText },
  ]},
  { group: "Reytinglar", items: [
    { to: "/reyting/ishchi", label: "Ishchi reytingi", icon: Trophy },
    { to: "/reyting/supervayzer", label: "Supervayzer reytingi", icon: ShieldCheck },
    { to: "/reyting/menejer", label: "Menejer reytingi", icon: UserCog },
  ]},
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-border bg-card transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
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
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300",
                        active
                          ? "bg-brand-soft text-brand"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
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
        <div className="absolute inset-x-3 bottom-3 rounded-xl border border-border bg-accent p-3">
          <p className="text-xs font-semibold">Admin</p>
          <p className="text-[11px] text-muted-foreground">Cheklovsiz huquq · 5 rol</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur lg:px-8">
          <button className="btn-ghost lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menyu">
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
          <p className="hidden text-sm text-muted-foreground lg:block">
            Mavsum: <span className="font-medium text-foreground">2026 · Iyul</span>
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-border px-3 py-1 text-xs text-muted-foreground sm:inline">
              Rol: Admin
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
