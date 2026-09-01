import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Briefcase, FileText, ShieldCheck, SlidersHorizontal, Tv, User, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/reyting/ishchi", label: "Ishchi", icon: User },
  { to: "/reyting/supervayzer", label: "Supervayzer", icon: ShieldCheck },
  { to: "/reyting/menejer", label: "Menejer", icon: Briefcase },
  { to: "/nizom", label: "Nizom", icon: FileText },
] as const;

const AUTO_KEY = "micco-reyting-auto";
const AUTO_MS = 12000;

/**
 * Barcha uchun ochiq, login talab qilmaydigan reyting sahifalari uchun umumiy qobiq.
 * `filters` — sahifaga xos filtr bo'limlari (masalan, liga/davr tanlash); faqat mobil
 * "Filterlar" kartasi ichida ko'rsatiladi, desktopda sahifaning o'zi chizadi.
 */
export function PublicShell({
  children,
  filters,
  onResetFilters,
}: {
  children: ReactNode;
  filters?: ReactNode;
  onResetFilters?: () => void;
}) {
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
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/15 text-race-muted transition-colors hover:border-white/30 hover:text-race-fg"
          >
            <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
          </Link>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand text-sm font-bold text-brand-foreground">
            M
          </div>
          <p className="hidden text-sm font-bold tracking-wide sm:block">MICCO</p>
        </div>

        <nav className="scrollbar-none flex max-w-full gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 sm:px-4 sm:text-xs",
                pathname === t.to ? "bg-white/10 text-brand shadow-glow" : "text-race-muted hover:text-race-fg",
              )}
            >
              <t.icon className="h-3.5 w-3.5 shrink-0" />
              {t.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={toggleAuto}
          aria-label={auto ? "Avto rejimni o'chirish" : "Avto rejimni yoqish"}
          className={cn(
            "relative flex shrink-0 items-center gap-2 overflow-hidden rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-all duration-300 sm:px-4 sm:py-2 sm:text-[11px]",
            auto ? "border-success/40 bg-success/10 text-success" : "border-white/15 text-race-muted hover:text-race-fg",
          )}
        >
          {auto ? (
            <span
              className="absolute inset-y-0 left-0 bg-success/15"
              style={{ width: `${progress}%`, transition: "width 0.1s linear" }}
            />
          ) : null}
          <span className={cn("live-dot relative", auto ? "text-success" : "text-race-muted")} />
          <Tv className="relative hidden h-3.5 w-3.5 shrink-0 sm:block" />
          <span className="relative">{auto ? "Live · Avto rejim" : "Avto rejim"}</span>
        </button>
      </header>

      <div className="px-4 pt-4 sm:hidden">
        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-brand-foreground">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide">Filterlar</p>
                <p className="text-[11px] text-race-muted">Kerakli ma'lumotlarni tanlab ko'ring</p>
              </div>
            </div>
            {onResetFilters ? (
              <button
                onClick={onResetFilters}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-semibold text-race-muted transition-colors hover:text-race-fg"
              >
                <RotateCcw className="h-3 w-3" />
                Qayta tiklash
              </button>
            ) : null}
          </div>

          <button
            onClick={toggleAuto}
            aria-label={auto ? "Avto rejimni o'chirish" : "Avto rejimni yoqish"}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <Tv className="h-4 w-4 shrink-0 text-race-muted" />
              <div className="text-left">
                <p className="text-xs font-bold">Avto rejim</p>
                <p className="text-[10px] text-race-muted">Sahifalar avtomatik almashadi</p>
              </div>
            </div>
            <span
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                auto ? "bg-success" : "bg-white/15",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  auto ? "translate-x-4" : "translate-x-0.5",
                )}
              />
            </span>
          </button>

          {filters}
        </div>
      </div>

      <main key={pathname} className="page-enter px-4 py-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
