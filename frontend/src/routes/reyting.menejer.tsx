import { createFileRoute } from "@tanstack/react-router";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { animate } from "animejs";
import { Percent } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { CountUp, Reveal } from "@/components/motion";
import { RankedDetailModal, type RankedDetailItem } from "@/components/RankedDetailModal";
import { PodiumSlot } from "@/components/Podium";
import { MONTHS } from "@/lib/micco-data";
import { api } from "@/lib/api";
import { avatarFor, monthParam, type RankedApiRow } from "@/lib/rating-api";
import { usePersistentState } from "@/lib/use-persistent-state";


// TV/monitor ekranida ko'rsatish uchun — sahifani qo'lda yangilamasdan, o'zi
// vaqti-vaqti bilan yangi ma'lumot bor-yo'qligini tekshirib turadi.
const LIVE_REFRESH_MS = 5_000;

function formatOyLabel(oy: string): string {
  const [year, month] = oy.split("-");
  return `${year} ${MONTHS[Number(month) - 1]?.toUpperCase() ?? month}`;
}

export const Route = createFileRoute("/reyting/menejer")({
  head: () => ({
    meta: [
      { title: "Menejer reytingi — umumiy ko'rsatgich | MICCO" },
      {
        name: "description",
        content: "Menejerlar reytingi: o'rin, yo'nalish belgisi va umumiy ko'rsatgich foizi hamda o'rtacha natija.",
      },
      { property: "og:title", content: "MICCO menejer reytingi" },
      { property: "og:description", content: "Eng sodda ko'rinishdagi menejer klassifikatsiyasi." },
    ],
  }),
  component: ManagerRating,
});

function ManagerRating() {
  const [date, setDate] = usePersistentState("micco-reyting-menejer-date", "2026-07-28");
  const [selected, setSelected] = useState<RankedDetailItem | null>(null);
  const oy = monthParam(date);

  const { data: apiRows = [] } = useQuery({
    queryKey: ["reyting", "menejer", oy],
    queryFn: () => api.get<RankedApiRow[]>(`/api/reyting/menejer?oy=${oy}`),
    refetchInterval: LIVE_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

  const rows = useMemo(
    () =>
      apiRows.map((r) => ({
        id: r.id,
        place: r.place,
        name: r.fullName,
        avatar: avatarFor(`${r.fullName}-${r.id}`),
        percent: r.percent,
        yesterday: r.place,
      })),
    [apiRows],
  );
  const avg = rows.length ? rows.reduce((s, r) => s + r.percent, 0) / rows.length : 0;

  const leader = rows[0];
  const second = rows[1];
  const third = rows[2];
  const hasPodium = Boolean(leader && second && third);
  const listRows = hasPodium ? rows.slice(3) : rows.slice(1);

  function toDetail(r: (typeof rows)[number]): RankedDetailItem {
    return {
      name: r.name,
      avatar: r.avatar,
      place: r.place,
      percent: r.percent,
      stats: [{ label: "Umumiy ko'rsatgich", value: `${r.percent}%`, icon: Percent }],
    };
  }

  // FLIP: o'rin almashganda qator eski joyidan yangi joyiga sirg'alib boradi.
  const rowElsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const prevTopsRef = useRef<Map<number, number>>(new Map());
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      prevTopsRef.current.clear();
      return;
    }
    const prevTops = prevTopsRef.current;
    const nextTops = new Map<number, number>();
    for (const r of rows) {
      const el = rowElsRef.current.get(r.id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      nextTops.set(r.id, top);
      const prevTop = prevTops.get(r.id);
      if (prevTop !== undefined && prevTop !== top) {
        const delta = prevTop - top;
        el.style.transform = `translateY(${delta}px)`;
        animate(el, { translateY: [delta, 0], duration: 1100, ease: "outQuad" });
      }
    }
    prevTopsRef.current = nextTops;
  }, [listRows]);

  return (
    <PublicShell>
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.02]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight lg:text-3xl">MENEJER REYTINGI</h1>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-race-muted">{formatOyLabel(oy)}</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/15 bg-white/5 transition-colors focus-within:border-brand">
            <input
              type="month"
              value={date.slice(0, 7)}
              onChange={(e) => setDate(`${e.target.value}-01`)}
              className="block max-w-full border-0 bg-transparent px-3 py-2 text-sm text-race-fg outline-none"
            />
          </div>
        </div>

        <div className="px-4 py-6 lg:px-8">
          {hasPodium ? (
            <div className="mb-8 flex items-end justify-center gap-3 sm:gap-8">
              <PodiumSlot
                avatar={second!.avatar}
                name={second!.name}
                percent={second!.percent}
                rank={2}
                size="sm"
                avatarRef={() => {}}
                onSelect={() => setSelected(toDetail(second!))}
              />
              <PodiumSlot
                avatar={leader!.avatar}
                name={leader!.name}
                percent={leader!.percent}
                rank={1}
                size="lg"
                crown
                avatarRef={() => {}}
                onSelect={() => setSelected(toDetail(leader!))}
              />
              <PodiumSlot
                avatar={third!.avatar}
                name={third!.name}
                percent={third!.percent}
                rank={3}
                size="sm"
                avatarRef={() => {}}
                onSelect={() => setSelected(toDetail(third!))}
              />
            </div>
          ) : leader ? (
            <Reveal>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelected(toDetail(leader!))}
                onKeyDown={(e) => e.key === "Enter" && setSelected(toDetail(leader!))}
                className="card-row podium-glow mb-5 cursor-pointer active:scale-[0.99]"
                style={{ borderColor: "color-mix(in oklab, var(--color-accent-gold) 45%, transparent)" }}
              >
                <span className="w-8 shrink-0 text-center text-2xl font-black tabular-nums">1</span>
                <img
                  src={leader.avatar}
                  alt={leader.name}
                  className="avatar-ring h-14 w-14 shrink-0"
                  style={{ borderColor: "var(--color-accent-gold)" }}
                />
                <p className="min-w-0 flex-1 truncate text-sm font-bold uppercase tracking-wide">{leader.name}</p>
                <span className="text-2xl font-black tabular-nums">
                  <CountUp value={leader.percent} decimals={1} suffix="%" />
                </span>
              </div>
            </Reveal>
          ) : (
            <p className="py-16 text-center text-sm text-race-muted">Hali menejer yo'q.</p>
          )}

          <div className="space-y-2">
            {listRows.map((r, i) => (
              <div
                key={r.id}
                ref={(el) => {
                  if (el) rowElsRef.current.set(r.id, el);
                  else rowElsRef.current.delete(r.id);
                }}
              >
                <Reveal delay={Math.min(i * 45, 500)}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(toDetail(r))}
                    onKeyDown={(e) => e.key === "Enter" && setSelected(toDetail(r))}
                    className="card-row cursor-pointer active:scale-[0.99]"
                  >
                    <span className="w-6 shrink-0 text-center text-base font-black tabular-nums sm:w-10 sm:text-2xl">
                      {r.place}
                    </span>
                    <img
                      src={r.avatar}
                      alt={r.name}
                      className="avatar-ring h-8 w-8 shrink-0 sm:h-11 sm:w-11"
                      style={{ borderColor: "color-mix(in oklab, white 20%, transparent)" }}
                    />
                    <span className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wide sm:text-sm">
                      {r.name}
                    </span>
                    <span className="text-sm font-black tabular-nums sm:text-lg">
                      <CountUp value={r.percent} decimals={1} suffix="%" />
                    </span>
                  </div>
                </Reveal>
              </div>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-5 py-4">
              <span className="text-sm font-bold uppercase tracking-widest text-race-muted">O'rtacha ko'rsatgich</span>
              <span className="text-2xl font-black tabular-nums">
                <CountUp value={Math.round(avg * 10) / 10} decimals={1} suffix="%" />
              </span>
            </div>
          </Reveal>
        </div>
      </div>

      <RankedDetailModal item={selected} subtitle={formatOyLabel(oy)} onClose={() => setSelected(null)} />
    </PublicShell>
  );
}
