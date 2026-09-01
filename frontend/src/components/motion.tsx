import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Intersection-Observer asosidagi scroll reveal + stagger */
export function Reveal({
  children,
  delay = 0,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setShown(true);
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <As
      ref={ref as never}
      className={cn("reveal", shown && "reveal-in", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </As>
  );
}

export function useCountUp(target: number, duration = 1400, decimals = 0) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return decimals ? value.toFixed(decimals) : Math.round(value).toLocaleString("ru-RU");
}

export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  duration = 1400,
}: {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}) {
  const v = useCountUp(value, duration, decimals);
  return (
    <span className="tabular-nums">
      {v}
      {suffix}
    </span>
  );
}

/** Radial (donut) progress — 0 dan qiymatgacha aylanib to'ladi */
export function Donut({
  value,
  size = 116,
  stroke = 10,
  label,
  tone = "primary",
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  tone?: "primary" | "success" | "warning" | "danger";
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value, 200) / 200;
  const [dash, setDash] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setDash(c * pct));
    return () => cancelAnimationFrame(id);
  }, [c, pct]);

  const color = {
    primary: "var(--color-brand)",
    success: "var(--color-success)",
    warning: "var(--color-warning)",
    danger: "var(--color-danger)",
  }[tone];

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-track)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray 1.5s cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-semibold tracking-tight">
          <CountUp value={value} decimals={value % 1 !== 0 ? 1 : 0} suffix="%" />
        </span>
        {label ? <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span> : null}
      </div>
    </div>
  );
}

export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: "brand" | "success" | "danger" }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setW(Math.min(100, (value / 200) * 100)));
    return () => cancelAnimationFrame(id);
  }, [value]);
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-track">
      <div
        className={cn(
          "h-full rounded-full",
          tone === "brand" && "bg-brand",
          tone === "success" && "bg-success",
          tone === "danger" && "bg-danger",
        )}
        style={{ width: `${w}%`, transition: "width 1.4s cubic-bezier(0.16,1,0.3,1)" }}
      />
    </div>
  );
}


export function Trend({ today, yesterday }: { today: number; yesterday: number }) {
  const diff = yesterday - today;
  const tone = diff > 0 ? "up" : diff < 0 ? "down" : "flat";
  return (
    <span
      className={cn(
        "trend-arrow items-center gap-1 text-sm font-semibold",
        tone === "up" && "trend-up text-success",
        tone === "down" && "trend-down text-danger",
        tone === "flat" && "trend-flat text-warning",
      )}
    >
      {tone === "up" ? "▲" : tone === "down" ? "▼" : "—"}
      {diff !== 0 ? Math.abs(diff) : ""}
    </span>
  );
}
