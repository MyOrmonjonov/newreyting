import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { animate } from "animejs";
import { X } from "lucide-react";

export type RankedDetailItem = {
  name: string;
  avatar: string;
  place: number;
  percent: number;
  stats: { label: string; value: string | number }[];
};

/** Supervayzer/menejer reytingi qatoriga bosilganda ochiladigan to'liq ma'lumot paneli —
 * reyting.ishchi.tsx'dagi AgentDetailModal bilan bir xil uslub, umumlashtirilgan holda. */
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
        className="w-full max-w-sm overflow-hidden rounded-t-2xl border border-white/10 bg-race-panel text-race-fg sm:rounded-2xl"
        style={{ opacity: 0 }}
      >
        <div
          className="relative px-5 pb-14 pt-5"
          style={{
            background:
              "linear-gradient(135deg, var(--color-race-red) 0%, color-mix(in oklab, var(--race-red-deep) 90%, black) 100%)",
          }}
        >
          <button
            onClick={handleClose}
            aria-label="Yopish"
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-black/20 text-white transition-colors hover:bg-black/35"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/85">
            {subtitle} · {item.place}-o'rin
          </span>
        </div>

        <div className="-mt-12 flex flex-col items-center px-5 text-center">
          <div className="h-24 w-24 overflow-hidden rounded-full ring-4 ring-race-panel">
            <img src={item.avatar} alt={item.name} className="cutout-avatar h-full w-full" />
          </div>
          <h3 className="mt-3 text-xl font-black uppercase tracking-tight">{item.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-race-muted">Umumiy ko'rsatgich: {item.percent}%</p>

          <div className="mt-5 grid w-full grid-cols-2 gap-2.5 pb-6">
            {item.stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                <p className="text-lg font-black tabular-nums">{s.value}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-race-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
