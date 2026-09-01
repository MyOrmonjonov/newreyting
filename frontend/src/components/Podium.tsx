import type { CSSProperties, Ref } from "react";
import { CountUp, Reveal } from "@/components/motion";

const CROWN_COLOR = "var(--color-accent-gold)";

/** Rank-asosidagi medal ranglari: 1-oltin, 2-kumush, 3-bronza (yulduzcha rasmlariga mos). */
function accentFor(rank: number): { color: string; glow: string } {
  if (rank === 1) return { color: "var(--color-accent-gold)", glow: "var(--color-accent-gold)" };
  if (rank === 2) return { color: "var(--color-accent-silver)", glow: "var(--color-accent-silver)" };
  return { color: "var(--color-accent-warm)", glow: "var(--color-accent-warm)" };
}

/** Rank raqami ichiga solingan haqiqiy foto-yulduzcha (oltin/kumush/bronza) — frontend/public'da saqlanadi. */
function starImageFor(rank: number): string {
  if (rank === 1) return "/star-gold.png";
  if (rank === 2) return "/star-silver.png";
  return "/star-bronze.png";
}

/** Podiumdagi bitta o'rin — avatar (1-o'rinda neon halqa) + ostida yulduzcha (raqam bilan) + ism + foiz. */
export function PodiumSlot({
  avatar,
  name,
  percent,
  rank,
  size,
  crown,
  avatarRef,
  onSelect,
}: {
  avatar: string;
  name: string;
  percent: number;
  rank: number;
  size: "sm" | "lg";
  crown?: boolean;
  avatarRef: Ref<HTMLImageElement>;
  onSelect: () => void;
}) {
  const { color, glow } = accentFor(rank);
  const avatarSize = size === "lg" ? "h-20 w-20 sm:h-24 sm:w-24" : "h-14 w-14 sm:h-16 sm:w-16";
  const sparkRadius = size === "lg" ? 50 : 38;
  const sparkCount = 6;
  const sparks = Array.from({ length: sparkCount }, (_, i) => {
    const angle = (i / sparkCount) * Math.PI * 2;
    return {
      dx: Math.round(Math.cos(angle) * sparkRadius),
      dy: Math.round(Math.sin(angle) * sparkRadius),
      delay: (i / sparkCount) * 1.8,
    };
  });

  const crownSparkCount = crown ? 5 : 0;
  const crownSparks = Array.from({ length: crownSparkCount }, (_, i) => {
    const angle = (i / crownSparkCount) * Math.PI * 2;
    const radius = 22;
    return {
      dx: Math.round(Math.cos(angle) * radius),
      dy: Math.round(Math.sin(angle) * radius) - 6,
      delay: (i / crownSparkCount) * 1.4,
    };
  });

  return (
    <Reveal delay={rank * 60}>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => e.key === "Enter" && onSelect()}
        className="flex cursor-pointer flex-col items-center transition-transform duration-200 active:scale-[0.97]"
      >
        <div className="relative">
          {crown ? (
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 sm:-top-10">
              {crownSparks.map((s, i) => (
                <span
                  key={i}
                  className="podium-spark"
                  style={
                    {
                      color: CROWN_COLOR,
                      left: "50%",
                      top: "50%",
                      "--spark-dx": `${s.dx}px`,
                      "--spark-dy": `${s.dy}px`,
                      animationDelay: `${s.delay}s`,
                    } as CSSProperties
                  }
                />
              ))}
              <span className="podium-pulse relative grid place-items-center">
                <span
                  className="absolute inset-0 rounded-full blur-md"
                  style={{ background: `radial-gradient(circle, ${CROWN_COLOR} 0%, transparent 70%)`, opacity: 0.65 }}
                />
                <img src="/crown-gold.png" alt="" className="relative h-auto w-14 sm:w-16" />
              </span>
            </div>
          ) : null}

          <div
            className={`relative rounded-full p-[3px] sm:p-1 ${crown ? "podium-pulse" : ""} ${avatarSize}`}
            style={
              {
                color,
                background: `conic-gradient(from 180deg, color-mix(in oklab, white 75%, ${color}), ${color}, color-mix(in oklab, black 35%, ${color}), ${color}, color-mix(in oklab, white 75%, ${color}))`,
                boxShadow: `0 0 26px -6px ${glow}`,
              } as CSSProperties
            }
          >
            {sparks.map((s, i) => (
              <span
                key={i}
                className="podium-spark"
                style={
                  {
                    color,
                    "--spark-dx": `${s.dx}px`,
                    "--spark-dy": `${s.dy}px`,
                    animationDelay: `${s.delay}s`,
                  } as CSSProperties
                }
              />
            ))}
            <img
              ref={avatarRef}
              src={avatar}
              alt={name}
              className="h-full w-full rounded-full object-cover"
              style={{ backgroundColor: "var(--color-race-panel)" }}
            />
          </div>
        </div>

        <span className="relative z-10 -mt-7 inline-grid place-items-center sm:-mt-8">
          <span
            className="absolute inset-0 rounded-full blur-md"
            style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, opacity: 0.55 }}
          />
          <img src={starImageFor(rank)} alt={`#${rank}`} className="relative h-11 w-auto sm:h-[3.25rem]" />
        </span>

        <p className="mt-2 line-clamp-2 max-w-[7rem] text-center text-[10px] font-bold leading-tight uppercase tracking-wide sm:max-w-[8rem] sm:text-xs">
          {name}
        </p>

        <span
          className="my-2 h-px w-8 rounded-full sm:w-10"
          style={{ backgroundColor: "color-mix(in oklab, white 18%, transparent)" }}
        />

        <p className="text-lg font-black tabular-nums sm:text-2xl" style={{ color }}>
          <CountUp value={percent} decimals={1} suffix="%" />
        </p>
      </div>
    </Reveal>
  );
}
