import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Tv } from "lucide-react";
import { cn } from "@/lib/utils";
import { PERIOD_LABEL } from "@/lib/micco-data";

const TABS = [
  { to: "/reyting/ishchi", label: "Ishchi reytingi" },
  { to: "/reyting/supervayzer", label: "Supervayzer reytingi" },
  { to: "/reyting/menejer", label: "Menejer reytingi" },
] as const;

const AUTO_KEY = "micco-reyting-auto";
const AUTO_MS = 12000;

/** Barcha uchun ochiq, login talab qilmaydigan reyting sahifalari uchun umumiy qobiq. */
export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [auto, setAuto] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    try {
      setAuto(localStorage.getItem(AUTO_KEY) === "1");
    } catch {
      /* localStorage yo'q bo'lishi mumkin — auto rejim shunchaki o'chiq qoladi */
    }
  }, []);

  useEffect(() => {
    if (!auto) {
      setProgress(0);
      return;
    }
    const start = Date.now();
    const tick = window.setInterval(() => {
      setProgress(Math.min(100, ((Date.now() - start) / AUTO_MS) * 100));
    }, 100);
    const timeout = window.setTimeout(() => {
      const idx = TABS.findIndex((t) => t.to === pathname);
      const next = TABS[(idx + 1) % TABS.length]!;
      void navigate({ to: next.to });
    }, AUTO_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(timeout);
    };
  }, [auto, pathname, navigate]);

  function toggleAuto() {
    setAuto((v) => {
      const next = !v;
      try {
        localStorage.setItem(AUTO_KEY, next ? "1" : "0");
      } catch {
        /* e'tiborsiz qoldiriladi */
      }
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-race-bg text-race-fg">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/"
            aria-label="Boshqaruv paneliga qaytish"
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-race-muted transition-colors hover:border-white/30 hover:text-race-fg sm:px-3 sm:text-xs"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Orqaga</span>
          </Link>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
            M
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-bold tracking-wide">MICCO</p>
            <p className="text-[10px] uppercase tracking-[0.22em] text-race-muted">{PERIOD_LABEL}</p>
          </div>
        </div>

        <nav className="scrollbar-none flex max-w-full gap-1 overflow-x-auto rounded-xl bg-white/5 p-1">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 sm:px-3 sm:text-xs",
                pathname === t.to
                  ? "bg-brand text-brand-foreground shadow-glow"
                  : "text-race-muted hover:text-race-fg",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={toggleAuto}
          className={cn(
            "relative flex shrink-0 items-center gap-1.5 overflow-hidden rounded-xl border px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 sm:gap-2 sm:px-4 sm:py-2 sm:text-xs",
            auto ? "border-brand bg-brand-soft text-brand" : "border-white/15 text-race-muted hover:text-race-fg",
          )}
        >
          {auto ? (
            <span
              className="absolute inset-y-0 left-0 bg-brand/25"
              style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
            />
          ) : null}
          <Tv className="relative h-3.5 w-3.5 shrink-0" />
          <span className="relative">{auto ? "Avto: yoniq" : "Avto rejim"}</span>
        </button>
      </header>

      <main key={pathname} className="page-enter px-4 py-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
