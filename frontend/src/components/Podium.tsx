import type { CSSProperties, Ref } from "react";
import { CountUp, Reveal } from "@/components/motion";

const CROWN_COLOR = "var(--color-accent-gold)";

/** Rank-asosidagi medal ranglari: 1-oltin, 2-ko'k, 3-to'q sariq (MICCO dizayn spetsifikatsiyasi). */
function accentFor(rank: number): { color: string; glow: string } {
  if (rank === 1) return { color: "var(--color-accent-gold)", glow: "var(--color-accent-gold)" };
  if (rank === 2) return { color: "var(--color-brand)", glow: "var(--color-brand)" };
  return { color: "var(--color-accent-warm)", glow: "var(--color-accent-warm)" };
}

// 5 uchli yulduzning 10 nuqtasi (tashqi uch / ichki botiq, navbat bilan) — faset uchburchaklari shundan yasaladi.
const STAR_POINTS: [number, number][] = [
  [12, 2],
  [15.09, 8.26],
  [22, 9.27],
  [17, 14.14],
  [18.18, 21.02],
  [12, 17.77],
  [5.82, 21.02],
  [7, 14.14],
  [2, 9.27],
  [8.91, 8.26],
];
const STAR_CENTER: [number, number] = [12, 12];

/** Metall/ko'p qirrali (faset) yulduzcha — markazdan chiquvchi 10 ta uchburchak faset + halo + markazdagi doira nishon. */
function MedalStar({ rank, color, glow, className }: { rank: number; color: string; glow: string; className: string }) {
  const gradId = `podium-star-grad-${rank}`;
  const glowId = `podium-star-glow-${rank}`;
  const [cx, cy] = STAR_CENTER;
  return (
    <svg viewBox="-6 -6 36 36" className={className} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={`color-mix(in oklab, white 85%, ${color})`} />
          <stop offset="30%" stopColor={`color-mix(in oklab, white 30%, ${color})`} />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor={`color-mix(in oklab, black 50%, ${color})`} />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.85" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="15" fill={`url(#${glowId})`} />
      <g style={{ filter: "drop-shadow(0 3px 3px rgba(0,0,0,0.55))" }}>
        {STAR_POINTS.map(([x1, y1], i) => {
          const [x2, y2] = STAR_POINTS[(i + 1) % STAR_POINTS.length]!;
          return (
            <polygon
              key={i}
              points={`${cx},${cy} ${x1},${y1} ${x2},${y2}`}
              fill={`url(#${gradId})`}
              stroke={`color-mix(in oklab, black 40%, ${color})`}
              strokeWidth="0.35"
              strokeLinejoin="round"
            />
          );
        })}
      </g>
      <circle
        cx={cx}
        cy={cy}
        r="4.4"
        fill={`color-mix(in oklab, black 70%, ${color})`}
        stroke={`url(#${gradId})`}
        strokeWidth="0.8"
      />
    </svg>
  );
}

/** Metall/hajmli oltin toj — gradient + soya bilan (tekis lucide ikonka o'rniga). */
// Toj tepasining konturi (chapdan o'ngga) — shundan markaziy asosga (12,18) faset uchburchaklari tortiladi.
const CROWN_OUTLINE: [number, number][] = [
  [2, 18],
  [4, 8],
  [8, 12],
  [12, 4],
  [16, 12],
  [20, 8],
  [22, 18],
];
const CROWN_BASE: [number, number] = [12, 18];

function GoldCrown({ className }: { className: string }) {
  const color = CROWN_COLOR;
  const [bx, by] = CROWN_BASE;
  return (
    <svg viewBox="0 0 24 24" className={className} style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
      <defs>
        <linearGradient id="podium-crown-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={`color-mix(in oklab, white 85%, ${color})`} />
          <stop offset="30%" stopColor={`color-mix(in oklab, white 30%, ${color})`} />
          <stop offset="60%" stopColor={color} />
          <stop offset="100%" stopColor={`color-mix(in oklab, black 45%, ${color})`} />
        </linearGradient>
      </defs>
      {CROWN_OUTLINE.slice(0, -1).map(([x1, y1], i) => {
        const [x2, y2] = CROWN_OUTLINE[i + 1]!;
        return (
          <polygon
            key={i}
            points={`${bx},${by} ${x1},${y1} ${x2},${y2}`}
            fill="url(#podium-crown-grad)"
            stroke={`color-mix(in oklab, black 40%, ${color})`}
            strokeWidth="0.3"
            strokeLinejoin="round"
          />
        );
      })}
      <rect
        x="2"
        y="18"
        width="20"
        height="3"
        rx="1"
        fill="url(#podium-crown-grad)"
        stroke={`color-mix(in oklab, black 30%, ${color})`}
        strokeWidth="0.5"
      />
      <circle cx="4" cy="8" r="1.4" fill="url(#podium-crown-grad)" />
      <circle cx="12" cy="4" r="1.6" fill="url(#podium-crown-grad)" />
      <circle cx="20" cy="8" r="1.4" fill="url(#podium-crown-grad)" />
      <circle cx="7" cy="19.5" r="0.7" fill={`color-mix(in oklab, white 70%, ${color})`} />
      <circle cx="17" cy="19.5" r="0.7" fill={`color-mix(in oklab, white 70%, ${color})`} />
      {/* Markaziy medalyon — ichida "1" raqami (HTML overlay orqali qo'yiladi) */}
      <circle
        cx="12"
        cy="19.5"
        r="2.3"
        fill={`color-mix(in oklab, black 65%, ${color})`}
        stroke="url(#podium-crown-grad)"
        strokeWidth="0.6"
      />
    </svg>
  );
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
                <GoldCrown className="relative h-9 w-9 sm:h-10 sm:w-10" />
                <span
                  className="absolute text-[8px] font-black leading-none sm:text-[9px]"
                  style={{ left: "50%", top: "81%", transform: "translate(-50%, -50%)", color: "color-mix(in oklab, white 90%, transparent)" }}
                >
                  1
                </span>
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
          <MedalStar rank={rank} color={color} glow={glow} className="h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]" />
          <span
            className="absolute inset-0 grid place-items-center text-xs font-black sm:text-sm"
            style={{ color: "color-mix(in oklab, white 88%, transparent)" }}
          >
            {rank}
          </span>
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
