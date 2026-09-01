import { useEffect, useRef } from "react";
import { animate } from "animejs";

/**
 * Butun ilova uchun umumiy fon: juda sekin suzuvchi, xira ko'k nur dog'lari —
 * professional, chalg'itmaydigan atmosfera uchun. Fixed, pointer-events-none —
 * hech qanday interaktiv elementga xalaqit bermaydi.
 *
 * Faqat `transform` animatsiya qilinadi (GPU compositor-friendly — layout/paint
 * qayta hisoblanmaydi), `will-change: transform` bilan birga jankning oldini oladi.
 */
export function RaceBackground() {
  const glowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    glowRefs.current.forEach((el, i) => {
      if (!el) return;
      animate(el, {
        translateX: [`${-6 - i * 4}vw`, `${8 + i * 5}vw`],
        translateY: [`${-4 - i * 2}vh`, `${6 + i * 4}vh`],
        scale: [1, 1.15, 1],
        loop: true,
        alternate: true,
        duration: 16000 + i * 3500,
        delay: i * 600,
        ease: "inOutSine",
      });
    });
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {[0, 1].map((i) => (
        <div
          key={i}
          ref={(el) => {
            glowRefs.current[i] = el;
          }}
          className="absolute h-[42vw] w-[42vw] rounded-full blur-3xl"
          style={{
            top: `${10 + i * 40}%`,
            left: `${i === 0 ? 8 : 58}%`,
            opacity: 0.16,
            willChange: "transform",
            background: "radial-gradient(circle, var(--race-red) 0%, transparent 70%)",
          }}
        />
      ))}
    </div>
  );
}
