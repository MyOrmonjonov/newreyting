import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Trophy, Medal } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { CountUp, Donut, Reveal, TimeFilter, periodFactor, type Period } from "@/components/motion";
import { LEAGUES, YEAR_STATS, buildLeague, buildSupervisorScoreboard } from "@/lib/micco-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MICCO Boshqaruv paneli — yillik natijalar va reyting" },
      {
        name: "description",
        content:
          "MICCO boshqaruv tizimi: yillik bajarilish foizi, 12 oylik statistika va 5 liga bo'yicha top-3 reyting.",
      },
      { property: "og:title", content: "MICCO Boshqaruv paneli" },
      {
        property: "og:description",
        content: "Yillik metrikalar, oylik statistika grafigi va liga reytinglari bir joyda.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [period, setPeriod] = useState<Period>("oy");
  const [date, setDate] = useState("2026-07-28");
  const f = periodFactor(period, date);

  const tops = useMemo(
    () => LEAGUES.map((l) => ({ league: l, rows: buildLeague(l.key, 3) })),
    [],
  );

  const chart = useMemo(
    () => YEAR_STATS.map((m) => ({ ...m, fakt: Math.round(m.fakt * f) })),
    [f],
  );

  const scoreboard = useMemo(() => buildSupervisorScoreboard(5), []);
  const scoreboardMonths = scoreboard[0]?.months.map((m) => m.month) ?? [];

  const metrics = [
    { label: "Yillik bajarilish", value: 118.4 * f, donut: true },
    { label: "Operatorlar", value: 4, suffix: "" },
    { label: "Menejerlar", value: 6, suffix: "" },
    { label: "Supervayzerlar", value: 10, suffix: "" },
    { label: "Ishchilar", value: Math.round(135 * f), suffix: "" },
  ];

  return (
    <AppShell>
      <PageHeader
        title="Bosh dashboard"
        subtitle="Yillik ko'rsatkichlar, oylik dinamika va liga yetakchilari"
        right={<TimeFilter value={period} onChange={setPeriod} date={date} onDate={setDate} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map((m, i) => (
          <Reveal key={m.label} delay={i * 60}>
            <div className="card-surface card-hover flex h-full items-center gap-4 p-5">
              {m.donut ? (
                <Donut value={Math.round(m.value * 10) / 10} size={96} stroke={9} />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-soft text-brand">
                  <span className="text-xl font-bold">
                    <CountUp value={m.value} />
                  </span>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{m.label}</p>
                {!m.donut ? (
                  <p className="mt-1 text-2xl font-semibold">
                    <CountUp value={m.value} />
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Plan / fakt og'irlikli</p>
                )}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal delay={80} className="mt-6 block">
        <div className="card-surface p-5">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold">Yillik statistika — 12 oy</h2>
              <p className="text-sm text-muted-foreground">Plan (100%) va fakt bajarilish dinamikasi</p>
            </div>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand capitalize">
              {period} kesimida
            </span>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-track)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    background: "var(--color-card)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="fakt" fill="var(--color-brand)" radius={[6, 6, 0, 0]} animationDuration={1200} />
                <Line
                  type="monotone"
                  dataKey="plan"
                  stroke="var(--color-warning)"
                  strokeWidth={2}
                  dot={false}
                  animationDuration={1400}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Reveal>

      <Reveal delay={100} className="mt-6 block">
        <div className="card-surface overflow-hidden">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border p-5">
            <div>
              <h2 className="text-lg font-semibold">Supervayzerlar reytingi — oylik ball</h2>
              <p className="text-sm text-muted-foreground">
                Har oy umumiy ko'rsatgich bo'yicha o'rin egallanadi, mezonga ko'ra ball beriladi
              </p>
            </div>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
              1-o'rin = 24 ball · har o'ringa -1 · 22-o'rin = 1 ball
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60 text-center text-xs uppercase tracking-wider text-muted-foreground">
                  <th rowSpan={2} className="sticky left-0 z-10 bg-muted/95 px-5 py-3 text-left font-medium backdrop-blur">
                    Supervayzer
                  </th>
                  {scoreboardMonths.map((m) => (
                    <th key={m} colSpan={2} className="border-l border-border px-3 py-2 font-medium">
                      {m}
                    </th>
                  ))}
                  <th colSpan={2} className="border-l border-border bg-brand-soft/40 px-3 py-2 font-medium text-brand">
                    {scoreboardMonths.length} oylik
                  </th>
                </tr>
                <tr className="border-b border-border bg-muted/40 text-center text-[10px] uppercase tracking-wider text-muted-foreground">
                  {scoreboardMonths.map((m) => (
                    <th key={m} colSpan={2} className="border-l border-border px-3 py-1.5 font-normal">
                      <span className="mr-2">Ko'rsatgi</span>
                      <span>Ball</span>
                    </th>
                  ))}
                  <th colSpan={2} className="border-l border-border bg-brand-soft/40 px-3 py-1.5 font-normal text-brand">
                    <span className="mr-2">O'rtacha</span>
                    <span>Ball</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {scoreboard.map((row, i) => (
                  <tr
                    key={row.name}
                    className="border-b border-border/70 text-center transition-colors duration-200 last:border-0 hover:bg-accent/70"
                    style={{ animation: `micco-rise 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 35}ms both` }}
                  >
                    <td className="sticky left-0 z-10 bg-card px-5 py-3 text-left">
                      <div className="flex items-center gap-2">
                        {row.place === 1 ? (
                          <Trophy className="h-4 w-4 shrink-0 text-warning" />
                        ) : row.place <= 3 ? (
                          <Medal className="h-4 w-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <span className="w-4 shrink-0 text-center text-xs font-semibold text-muted-foreground">
                            {row.place}
                          </span>
                        )}
                        <span className="font-medium">{row.name}</span>
                      </div>
                    </td>
                    {row.months.map((m) => (
                      <Fragment key={m.month}>
                        <td className="border-l border-border px-3 py-3 tabular-nums">{m.percent}%</td>
                        <td className="px-3 py-3 font-semibold tabular-nums">{m.points}</td>
                      </Fragment>
                    ))}
                    <td className="border-l border-border bg-brand-soft/20 px-3 py-3 tabular-nums">
                      {row.avgPercent}%
                    </td>
                    <td
                      className={cn(
                        "bg-brand-soft/20 px-3 py-3 text-base font-bold tabular-nums",
                        row.place === 1 ? "text-brand" : "text-foreground",
                      )}
                    >
                      {row.totalPoints}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      <h2 className="mt-8 mb-4 text-lg font-semibold">Ligalar bo'yicha top-3</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        {tops.map((t, i) => (
          <Reveal key={t.league.key} delay={i * 70}>
            <div className="card-surface card-hover h-full p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold tracking-wide">{t.league.name}</p>
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: t.league.accent }}
                />
              </div>
              <ul className="space-y-3">
                {t.rows.map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <span className="w-4 text-sm font-bold text-muted-foreground">{r.place}</span>
                    <img src={r.avatar} alt={r.fullName} className="h-8 w-8 rounded-full bg-accent" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{r.fullName}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{r.supervisor}</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">{r.percent}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </AppShell>
  );
}
