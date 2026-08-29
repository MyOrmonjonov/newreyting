import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/PublicShell";
import { CountUp, Reveal, Trend } from "@/components/motion";
import { MONTHS } from "@/lib/micco-data";
import { api } from "@/lib/api";
import { avatarFor, type ScoreboardApiRow } from "@/lib/rating-api";

function formatOyLabel(oy: string): string {
  const [year, month] = oy.split("-");
  return `${year} ${MONTHS[Number(month) - 1]?.toUpperCase() ?? month}`;
}

export const Route = createFileRoute("/reyting/supervayzer")({
  head: () => ({
    meta: [
      { title: "Supervayzer reytingi — umumiy ko'rsatgich | MICCO" },
      {
        name: "description",
        content:
          "Supervayzerlar reytingi: o'rin, yo'nalish belgisi, kunlik o'zgarish, oylik va umumiy reyting ball hamda umumiy ko'rsatgich foizi.",
      },
      { property: "og:title", content: "MICCO supervayzer reytingi" },
      { property: "og:description", content: "Supervayzerlar bo'yicha eng sodda ko'rinishdagi klassifikatsiya." },
    ],
  }),
  component: SupervisorRating,
});

function SupervisorRating() {
  const { data: apiRows = [] } = useQuery({
    queryKey: ["reyting", "supervayzer", "tarix"],
    queryFn: () => api.get<ScoreboardApiRow[]>("/api/reyting/supervayzer/tarix?oyCount=7"),
  });

  const rows = useMemo(
    () =>
      apiRows.map((r) => {
        const oylar = r.oylar;
        const last = oylar[oylar.length - 1];
        const prev = oylar[oylar.length - 2];
        return {
          place: r.place,
          name: r.fullName,
          avatar: avatarFor(`${r.fullName}-${r.id}`),
          percent: last?.percent ?? 0,
          daily: last && prev ? Math.round((last.percent - prev.percent) * 10) / 10 : 0,
          yesterday: r.place,
          monthPoints: last?.ball ?? 0,
          totalPoints: r.jamiBall,
        };
      }),
    [apiRows],
  );
  const avg = rows.length ? rows.reduce((s, r) => s + r.percent, 0) / rows.length : 0;
  const totalPoints = rows.reduce((s, r) => s + r.totalPoints, 0);
  const currentOy = apiRows[0]?.oylar[apiRows[0].oylar.length - 1]?.oy ?? new Date().toISOString().slice(0, 7) + "-01";

  return (
    <PublicShell>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight lg:text-3xl">SUPERVAYZER REYTINGI</h1>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-race-muted">{formatOyLabel(currentOy)}</p>
          </div>
        </div>

        <div className="px-4 py-6 lg:px-8">
          <div className="mb-2 hidden px-4 text-[10px] uppercase tracking-widest text-race-muted sm:flex">
            <span className="w-12">№</span>
            <span className="w-12">Yo'n.</span>
            <span className="flex-1">Supervayzer</span>
            <span className="w-20 text-right">Kunlik</span>
            <span className="w-24 text-right">Oylik ball</span>
            <span className="w-24 text-right">Jami ball</span>
            <span className="w-32 text-right">Umumiy ko'rsatgich</span>
          </div>

          <div className="space-y-1.5">
            {rows.map((r, i) => (
              <Reveal key={r.name} delay={i * 60}>
                <div className="race-row rounded-md">
                  <span className="ml-0 h-8 w-1.5 shrink-0 rounded-r bg-white/70 sm:h-10" />
                  <span className="w-6 shrink-0 text-center text-base font-black tabular-nums sm:w-10 sm:text-2xl">
                    {r.place}
                  </span>
                  <span className="hidden sm:block sm:w-12">
                    <Trend today={r.place} yesterday={r.yesterday} />
                  </span>
                  <img
                    src={r.avatar}
                    alt={r.name}
                    className="cutout-avatar h-8 w-8 shrink-0 sm:h-10 sm:w-10"
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wide sm:text-sm">
                    {r.name}
                  </span>
                  <span
                    className={`hidden w-20 text-right text-sm font-bold tabular-nums sm:block ${
                      r.daily >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {r.daily >= 0 ? "+" : ""}
                    {r.daily}%
                  </span>
                  <span className="hidden w-24 text-right text-sm font-bold tabular-nums sm:block">
                    {r.monthPoints}
                  </span>
                  <span className="hidden w-24 text-right text-sm font-bold tabular-nums sm:block">
                    {r.totalPoints}
                  </span>
                  <span className="w-16 shrink-0 text-right text-base font-black tabular-nums sm:w-32 sm:text-xl">
                    <CountUp value={r.percent} decimals={1} suffix="%" />
                  </span>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Reveal delay={120}>
              <div className="flex items-center justify-between rounded-md border border-white/15 bg-white/5 px-5 py-4">
                <span className="text-sm font-bold uppercase tracking-widest text-race-muted">O'rtacha ko'rsatgich</span>
                <span className="text-2xl font-black tabular-nums">
                  <CountUp value={Math.round(avg * 10) / 10} decimals={1} suffix="%" />
                </span>
              </div>
            </Reveal>
            <Reveal delay={160}>
              <div className="flex items-center justify-between rounded-md border border-white/15 bg-white/5 px-5 py-4">
                <span className="text-sm font-bold uppercase tracking-widest text-race-muted">Jami reyting ball</span>
                <span className="text-2xl font-black tabular-nums">
                  <CountUp value={totalPoints} />
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
