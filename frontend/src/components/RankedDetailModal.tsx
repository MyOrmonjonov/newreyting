import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { animate } from "animejs";
import { X, CalendarDays, type LucideIcon } from "lucide-react";

export type RankedDetailStat = { label: string; value: string | number; icon: LucideIcon };

export type RankedDetailItem = {
  name: string;
  avatar: string;
  place: number;
  percent: number;
  /** Ism ostida ko'rsatiladigan qo'shimcha qator, masalan "Supervayzer: X". */
  subtitle2?: string;
  stats: RankedDetailStat[];
};

/** Supervayzer/menejer/ishchi reytingi qatoriga bosilganda ochiladigan to'liq ma'lumot paneli. */
export function RankedDetailModal({
  item,
  subtitle,
  onClose,
}: {
  item: RankedDetailItem | null;
  subtitle: string;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!item || !backdropRef.current || !cardRef.current) return;
    animate(backdropRef.current, { opacity: [0, 1], duration: 220, ease: "outQuad" });
    animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [28, 0],
      scale: [0.94, 1],
      duration: 420,
      ease: "outExpo",
    });
  }, [item]);

  function handleClose() {
    if (!backdropRef.current || !cardRef.current) {
      onClose();
      return;
    }
    animate(backdropRef.current, { opacity: [1, 0], duration: 180, ease: "inQuad" });
    animate(cardRef.current, {
      opacity: [1, 0],
      translateY: [0, 20],
      scale: [1, 0.95],
      duration: 200,
      ease: "inQuad",
      onComplete: onClose,
    });
    window.setTimeout(onClose, 260);
  }

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  if (!item || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      style={{ opacity: 0 }}
      onClick={handleClose}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-t-2xl border border-white/10 bg-race-panel text-race-fg sm:rounded-2xl"
        style={{ opacity: 0 }}
      >
        <div className="relative overflow-hidden px-5 pb-2 pt-5">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 100% at 50% -10%, color-mix(in oklab, var(--color-race-red) 55%, transparent), transparent 60%)",
            }}
          />
          <div className="relative flex items-center justify-between">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/85">
              <CalendarDays className="h-3 w-3" />
              {subtitle} · {item.place}-o'rin
            </span>
            <button
              onClick={handleClose}
              aria-label="Yopish"
              className="grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Avatar — porloq romka + p'edestal effektida */}
          <div className="relative mx-auto mt-4 flex h-40 w-40 items-center justify-center">
            <div
              className="absolute inset-0 rounded-full opacity-70 blur-2xl"
              style={{ background: "var(--color-race-red)" }}
            />
            <div
              className="absolute h-28 w-28 rounded-2xl border border-white/25"
              style={{
                transform: "rotate(45deg)",
                background:
                  "linear-gradient(135deg, color-mix(in oklab, var(--color-race-red) 35%, transparent), transparent 60%)",
                boxShadow: "0 0 30px -4px color-mix(in oklab, var(--color-race-red) 70%, transparent)",
              }}
            />
            <div
              className="absolute h-14 w-14 rounded-lg border border-white/20 opacity-60"
              style={{ transform: "translate(-46px, -38px) rotate(20deg)" }}
            />
            <div
              className="absolute h-9 w-9 rounded-md border border-white/20 opacity-50"
              style={{ transform: "translate(50px, 34px) rotate(-15deg)" }}
            />
            <div className="relative h-24 w-24 overflow-hidden rounded-full ring-4 ring-race-panel">
              <img src={item.avatar} alt={item.name} className="cutout-avatar h-full w-full" />
            </div>
            <div
              className="absolute -bottom-2 h-4 w-28 rounded-full opacity-80 blur-md"
              style={{ background: "var(--color-race-red)" }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center px-5 pb-6 text-center">
          <h3 className="mt-1 text-xl font-black uppercase tracking-tight">{item.name}</h3>
          {item.subtitle2 ? (
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-race-muted">
              {item.subtitle2.split(":")[0]}:{" "}
              <span className="text-brand">{item.subtitle2.split(":").slice(1).join(":").trim()}</span>
            </p>
          ) : null}

          <div className="mt-5 grid w-full grid-cols-2 gap-2.5">
            {item.stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left"
              >
                <div
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                  style={{
                    backgroundColor: "color-mix(in oklab, var(--color-race-red) 18%, transparent)",
                    color: "var(--color-race-red)",
                  }}
                >
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-black leading-tight tabular-nums">{s.value}</p>
                  <p className="truncate text-[10px] uppercase tracking-widest text-race-muted">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
