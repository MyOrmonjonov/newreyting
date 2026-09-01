import type { CSSProperties, Ref } from "react";
import { Crown, Star } from "lucide-react";
import { CountUp, Reveal } from "@/components/motion";

/** 1/2/3-o'rin uchun medal ranglari — liga rangidan mustaqil, doim shu uchtasi. */
function medalPalette(rank: number): { color: string; glow: string } {
  if (rank === 1) return { color: "var(--color-accent-gold)", glow: "var(--color-accent-gold)" };
  if (rank === 2) return { color: "var(--color-accent-silver)", glow: "var(--color-accent-silver)" };
  return { color: "var(--color-accent-warm)", glow: "var(--color-accent-warm-deep)" };
}

/** Podiumdagi bitta o'rin — faqat avatar (gradient halqa + yulduzcha nishon) + ism + foiz, karta/pьedestal yo'q. */
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
  const { color, glow } = medalPalette(rank);
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
            <Crown
              className="podium-pulse absolute -top-7 left-1/2 h-6 w-6 -translate-x-1/2 sm:-top-8 sm:h-7 sm:w-7"
              style={{ color }}
              fill={color}
            />
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

          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <Star className="h-6 w-6 sm:h-7 sm:w-7" style={{ color, fill: color }} strokeWidth={1.5} />
            <span
              className="absolute inset-0 grid place-items-center text-[9px] font-black sm:text-[10px]"
              style={{ color: "var(--color-race-panel)" }}
            >
              {rank}
            </span>
          </div>
        </div>

        <p className="mt-4 line-clamp-2 max-w-[7rem] text-center text-[10px] font-bold leading-tight uppercase tracking-wide sm:max-w-[8rem] sm:text-xs">
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
