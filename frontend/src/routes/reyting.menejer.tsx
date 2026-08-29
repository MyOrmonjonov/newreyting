import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PublicShell } from "@/components/PublicShell";
import { CountUp, Reveal, TimeFilter, Trend, type Period } from "@/components/motion";
import { MONTHS } from "@/lib/micco-data";
import { api } from "@/lib/api";
import { avatarFor, monthParam, type RankedApiRow } from "@/lib/rating-api";

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
  const [period, setPeriod] = useState<Period>("oy");
  const [date, setDate] = useState("2026-07-28");
  const oy = monthParam(date);

  const { data: apiRows = [] } = useQuery({
    queryKey: ["reyting", "menejer", oy],
    queryFn: () => api.get<RankedApiRow[]>(`/api/reyting/menejer?oy=${oy}`),
  });

  const rows = useMemo(
    () =>
      apiRows.map((r) => ({
        place: r.place,
        name: r.fullName,
        avatar: avatarFor(`${r.fullName}-${r.id}`),
        percent: r.percent,
        yesterday: r.place,
      })),
    [apiRows],
  );
  const avg = rows.length ? rows.reduce((s, r) => s + r.percent, 0) / rows.length : 0;

  return (
    <PublicShell>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight lg:text-3xl">MENEJER REYTINGI</h1>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-race-muted">{formatOyLabel(oy)}</p>
          </div>
          <TimeFilter value={period} onChange={setPeriod} date={date} onDate={setDate} />
        </div>

        <div className="px-4 py-6 lg:px-8">
          <div className="mb-2 flex px-4 text-[10px] uppercase tracking-widest text-race-muted">
            <span className="w-12">№</span>
            <span className="w-14">Yo'n.</span>
            <span className="flex-1">Menejer</span>
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
                  <span className="w-16 shrink-0 text-right text-base font-black tabular-nums sm:w-32 sm:text-xl">
                    <CountUp value={r.percent} decimals={1} suffix="%" />
                  </span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <div className="mt-4 flex items-center justify-between rounded-md border border-white/15 bg-white/5 px-5 py-4">
              <span className="text-sm font-bold uppercase tracking-widest text-race-muted">O'rtacha ko'rsatgich</span>
              <span className="text-2xl font-black tabular-nums">
                <CountUp value={Math.round(avg * 10) / 10} decimals={1} suffix="%" />
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </PublicShell>
  );
}
