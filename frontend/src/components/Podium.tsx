import type { CSSProperties, Ref } from "react";
import { Crown } from "lucide-react";
import { CountUp, Reveal } from "@/components/motion";

const CROWN_COLOR = "var(--color-accent-gold)";

/** Faqat 1-o'rin brend (ko'k/moviy) urg'u rangini oladi — 2/3-o'rin neytral/muted. */
function accentFor(rank: number): { color: string; glow: string; muted: boolean } {
  if (rank === 1) return { color: "var(--color-brand)", glow: "var(--color-brand)", muted: false };
  return { color: "color-mix(in oklab, white 55%, transparent)", glow: "transparent", muted: true };
}

/** Podiumdagi bitta o'rin — avatar (1-o'rinda neon halqa) + ostida "#N" pill + ism + foiz. */
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
  const { color, glow, muted } = accentFor(rank);
  const avatarSize = size === "lg" ? "h-20 w-20 sm:h-24 sm:w-24" : "h-14 w-14 sm:h-16 sm:w-16";
  const sparkRadius = size === "lg" ? 50 : 38;
  const sparkCount = muted ? 0 : 6;
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
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 sm:-top-8">
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
              <Crown
                className="podium-pulse relative h-6 w-6 sm:h-7 sm:w-7"
                style={{ color: CROWN_COLOR }}
                fill={CROWN_COLOR}
              />
            </div>
          ) : null}

          <div
            className={`relative rounded-full p-[3px] sm:p-1 ${crown ? "podium-pulse" : ""} ${avatarSize}`}
            style={
              {
                color,
                background: muted
                  ? "color-mix(in oklab, white 22%, transparent)"
                  : `conic-gradient(from 180deg, color-mix(in oklab, white 75%, ${color}), ${color}, color-mix(in oklab, black 35%, ${color}), ${color}, color-mix(in oklab, white 75%, ${color}))`,
                boxShadow: muted ? undefined : `0 0 26px -6px ${glow}`,
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

        <span
          className="mt-2.5 min-w-[2.75rem] rounded-lg border px-2.5 py-1 text-center text-[10px] font-black tabular-nums sm:min-w-[3.25rem] sm:text-xs"
          style={
            muted
              ? {
                  borderColor: "color-mix(in oklab, white 18%, transparent)",
                  backgroundColor: "color-mix(in oklab, white 6%, transparent)",
                  color: "var(--color-race-muted)",
                }
              : {
                  borderColor: `color-mix(in oklab, ${color} 55%, transparent)`,
                  backgroundColor: `color-mix(in oklab, ${color} 18%, transparent)`,
                  color,
                }
          }
        >
          #{rank}
        </span>

        <p className="mt-2 line-clamp-2 max-w-[7rem] text-center text-[10px] font-bold leading-tight uppercase tracking-wide sm:max-w-[8rem] sm:text-xs">
          {name}
        </p>

        <span
          className="my-2 h-px w-8 rounded-full sm:w-10"
          style={{ backgroundColor: "color-mix(in oklab, white 18%, transparent)" }}
        />

        <p
          className="text-lg font-black tabular-nums sm:text-2xl"
          style={{ color: muted ? "var(--color-race-fg)" : color }}
        >
          <CountUp value={percent} decimals={1} suffix="%" />
        </p>
      </div>
    </Reveal>
  );
}
