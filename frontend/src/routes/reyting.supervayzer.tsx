import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CountUp, Reveal, TimeFilter, Trend, periodFactor, type Period } from "@/components/motion";
import { PERIOD_LABEL, buildSupervisors } from "@/lib/micco-data";

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
  const [period, setPeriod] = useState<Period>("oy");
  const [date, setDate] = useState("2026-07-28");
  const f = periodFactor(period, date);

  const rows = useMemo(
    () => buildSupervisors().map((r) => ({ ...r, percent: Math.round(r.percent * f * 10) / 10 })),
    [f],
  );
  const avg = rows.reduce((s, r) => s + r.percent, 0) / rows.length;
  const totalPoints = rows.reduce((s, r) => s + r.totalPoints, 0);

  return (
    <AppShell>
      <div className="overflow-hidden rounded-2xl bg-race-bg text-race-fg">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight lg:text-3xl">SUPERVAYZER REYTINGI</h1>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-race-muted">{PERIOD_LABEL}</p>
          </div>
          <TimeFilter value={period} onChange={setPeriod} date={date} onDate={setDate} />
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
                  <span className="ml-0 h-10 w-1.5 shrink-0 rounded-r bg-white/70" />
                  <span className="w-10 text-center text-2xl font-black tabular-nums">{r.place}</span>
                  <span className="w-12">
                    <Trend today={r.place} yesterday={r.yesterday} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold uppercase tracking-wide">{r.name}</span>
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
                  <span className="w-32 text-right text-xl font-black tabular-nums">
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
    </AppShell>
  );
}
