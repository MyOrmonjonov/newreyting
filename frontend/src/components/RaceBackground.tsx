import { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";

/**
 * Butun ilova uchun umumiy fon: sekin suzuvchi qizil/olovrang nur dog'lari +
 * davriy "poyga tezligi" chiziqlari + tepada uzluksiz suriladigan shaxmat lentasi.
 * Fixed, pointer-events-none — hech qanday interaktiv elementga xalaqit bermaydi.
 *
 * Faqat `transform` va `opacity` animatsiya qilinadi (GPU compositor-friendly —
 * layout/paint qayta hisoblanmaydi), shu bilan birga har bir qatlamga
 * `will-change: transform` berilgan — shu ikkisi birga qotishning (jank) oldini oladi.
 */
export function RaceBackground() {
  const glowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const streakRefs = useRef<(HTMLDivElement | null)[]>([]);
  const checkerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    glowRefs.current.forEach((el, i) => {
      if (!el) return;
      animate(el, {
        translateX: [`${-7 - i * 5}vw`, `${10 + i * 6}vw`],
        translateY: [`${-5 - i * 3}vh`, `${8 + i * 5}vh`],
        scale: [1, 1.22, 1],
        loop: true,
        alternate: true,
        duration: 13000 + i * 3200,
        delay: i * 500,
        ease: "inOutSine",
      });
    });

    streakRefs.current.forEach((el, i) => {
      if (!el) return;
      animate(el, {
        translateX: ["-25vw", "125vw"],
        opacity: [0, 0.75, 0.75, 0],
        loop: true,
        duration: 1700 + (i % 3) * 400,
        delay: stagger(1000, { start: i * 650 }),
        ease: "inQuad",
      });
    });

    // Shaxmat lentasi: naqsh eni x2 qilib chizilgan, translateX 0 -> -50% qilib
    // uzluksiz "loop" qilinadi — transform-based, shu sabab silliq (compositor layer).
    if (checkerRef.current) {
      animate(checkerRef.current, {
        translateX: ["0%", "-50%"],
        loop: true,
        duration: 2200,
        ease: "linear",
      });
    }
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1.5 overflow-hidden opacity-50">
        <div
          ref={checkerRef}
          className="h-full w-[200%]"
          style={{
            willChange: "transform",
            backgroundImage:
              "repeating-linear-gradient(90deg, var(--race-fg) 0 12px, transparent 12px 24px)",
          }}
        />
      </div>

      {[0, 1, 2].map((i) => (
        <div
          key={i}
          ref={(el) => {
            glowRefs.current[i] = el;
          }}
          className="absolute h-[46vw] w-[46vw] rounded-full blur-3xl"
          style={{
            top: `${8 + i * 28}%`,
            left: `${i === 1 ? 55 : 10 + i * 8}%`,
            opacity: 0.38,
            willChange: "transform",
            background:
              i % 2 === 0
                ? "radial-gradient(circle, var(--race-red) 0%, transparent 70%)"
                : "radial-gradient(circle, oklch(0.62 0.19 55) 0%, transparent 70%)",
          }}
        />
      ))}

      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          ref={(el) => {
            streakRefs.current[i] = el;
          }}
          className="absolute h-[3px] w-[28vw] opacity-0"
          style={{
            top: `${12 + i * 17}%`,
            transform: "rotate(-10deg)",
            willChange: "transform, opacity",
            background:
              "linear-gradient(90deg, transparent, var(--race-red) 32%, var(--race-fg) 60%, transparent)",
            filter: "drop-shadow(0 0 8px var(--race-red))",
          }}
        />
      ))}
    </div>
  );
}
