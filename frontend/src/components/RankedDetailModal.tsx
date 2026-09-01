import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { animate } from "animejs";
import { X, Trophy, type LucideIcon } from "lucide-react";
import { CountUp } from "@/components/motion";

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

function pickStat(stats: RankedDetailStat[], match: RegExp) {
  return stats.find((s) => match.test(s.label));
}

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
      translateY: [64, 0],
      translateZ: [-420, 0],
      scale: [0.6, 1],
      rotateX: [20, 0],
      duration: 680,
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
      translateY: [0, 28],
      translateZ: [0, -260],
      scale: [1, 0.78],
      rotateX: [0, 12],
      duration: 240,
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

  const todayStat = pickStat(item.stats, /bugun/i);
  const yesterdayStat = pickStat(item.stats, /kecha/i);
  const trophyStat = pickStat(item.stats, /kubok|chempion/i);
  const yearsStat = pickStat(item.stats, /yildan/i);
  const usedLabels = new Set(
    [todayStat, yesterdayStat, trophyStat, yearsStat].filter((s): s is RankedDetailStat => Boolean(s)).map((s) => s.label),
  );
  const otherStats = item.stats.filter(
    (s) => !usedLabels.has(s.label) && !/^(foizi|umumiy ko'rsatgich)$/i.test(s.label),
  );

  const todayNum = typeof todayStat?.value === "number" ? todayStat.value : undefined;
  const yesterdayNum = typeof yesterdayStat?.value === "number" ? yesterdayStat.value : undefined;
  const trendUp = todayNum !== undefined && yesterdayNum !== undefined ? todayNum >= yesterdayNum : undefined;

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-3 pb-28 pt-3 backdrop-blur-sm sm:px-4 sm:pb-36 sm:pt-4"
      style={{ opacity: 0, perspective: "1000px" }}
      onClick={handleClose}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[19rem] overflow-hidden rounded-3xl border text-race-fg"
        style={{
          opacity: 0,
          transformStyle: "preserve-3d",
          borderColor: "color-mix(in oklab, white 12%, transparent)",
          background:
            "linear-gradient(175deg, color-mix(in oklab, white 7%, var(--color-race-panel)), color-mix(in oklab, white 1%, var(--color-race-panel)))",
          backdropFilter: "blur(20px)",
          boxShadow: "0 1px 0 0 color-mix(in oklab, white 12%, transparent) inset, 0 30px 60px -24px oklch(0 0 0 / 0.85)",
        }}
      >
        <button
          onClick={handleClose}
          aria-label="Yopish"
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
          <div className="relative mb-3 h-24 w-24">
            <div
              className="absolute inset-0 rounded-full opacity-70 blur-xl"
              style={{ background: "var(--color-brand)" }}
            />
            <img
              src={item.avatar}
              alt={item.name}
              className="avatar-ring relative h-24 w-24"
              style={{
                borderColor: "var(--color-brand)",
                boxShadow: "0 0 30px -6px var(--color-brand)",
              }}
            />
          </div>

          <h3 className="text-base font-black uppercase tracking-tight">{item.name}</h3>
          {item.subtitle2 ? (
            <p className="mt-0.5 text-[11px] text-race-muted">
              {item.subtitle2.split(":").slice(1).join(":").trim() || item.subtitle2}
            </p>
          ) : null}

          <p className="mt-3 text-5xl font-black tabular-nums leading-none">
            <CountUp value={item.percent} decimals={1} suffix="%" />
          </p>

          {todayStat || yesterdayStat ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-race-muted">
              {todayStat ? (
                <span>
                  {todayStat.label}: <b className="text-race-fg">{todayStat.value}</b>
                </span>
              ) : null}
              {todayStat && yesterdayStat ? <span className="text-race-muted">vs</span> : null}
              {yesterdayStat ? (
                <span className="flex items-center gap-1">
                  {yesterdayStat.label}: <b className="text-race-fg">{yesterdayStat.value}</b>
                  {trendUp !== undefined ? (
                    <span className={trendUp ? "text-success" : "text-danger"}>{trendUp ? "▲" : "▼"}</span>
                  ) : null}
                </span>
              ) : null}
            </div>
          ) : null}

          {trophyStat && Number(trophyStat.value) > 0 ? (
            <span
              className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
              style={{
                backgroundColor: "color-mix(in oklab, var(--color-accent-warm) 20%, transparent)",
                color: "var(--color-accent-warm)",
              }}
            >
              <Trophy className="h-3.5 w-3.5" />×{trophyStat.value} chempionlik
            </span>
          ) : null}

          {otherStats.length ? (
            <div className="mt-4 flex w-full flex-wrap justify-center gap-2">
              {otherStats.map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-race-muted"
                >
                  <s.icon className="h-3 w-3" />
                  <b className="text-race-fg">{s.value}</b> {s.label}
                </span>
              ))}
            </div>
          ) : null}

          {yearsStat ? (
            <p className="mt-4 text-[11px] text-race-muted">{yearsStat.value} yildan beri MICCO'da</p>
          ) : (
            <p className="mt-4 text-[10px] uppercase tracking-widest text-race-muted">
              {subtitle} · {item.place}-o'rin
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
