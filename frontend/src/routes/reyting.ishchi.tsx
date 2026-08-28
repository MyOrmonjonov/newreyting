import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CountUp, Reveal, TimeFilter, Trend, periodFactor, type Period } from "@/components/motion";
import { LEAGUES, PERIOD_LABEL, buildLeague, type LeagueKey } from "@/lib/micco-data";

export const Route = createFileRoute("/reyting/ishchi")({
  head: () => ({
    meta: [
      { title: "Ishchi reytingi — 5 liga klassifikatsiyasi | MICCO" },
      {
        name: "description",
        content:
          "Diamond, Gold, Silver, Bronze va Rising ligalari bo'yicha ishchilar reytingi: plan bajarish foizi, reyting ball, ko'tarilish va pasayish zonalari.",
      },
      { property: "og:title", content: "MICCO ishchi reytingi" },
      { property: "og:description", content: "Ochiq reyting sahifasi — login talab qilinmaydi." },
    ],
  }),
  component: AgentRating,
});

function AgentRating() {
  const [league, setLeague] = useState<LeagueKey>("diamond");
  const [period, setPeriod] = useState<Period>("oy");
  const [date, setDate] = useState("2026-07-28");
  const f = periodFactor(period, date);

  const meta = LEAGUES.find((l) => l.key === league)!;
  const rows = useMemo(
    () =>
      buildLeague(league, 27).map((r) => ({
        ...r,
        percent: Math.round(r.percent * f * 10) / 10,
      })),
    [league, f],
  );

  const leader = rows[0]!;
  const rest = rows.slice(1);

  return (
    <AppShell>
      <div className="overflow-hidden rounded-2xl bg-race-bg text-race-fg">
        {/* Liga navigatsiyasi */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="relative flex flex-wrap gap-1 rounded-xl bg-white/5 p-1">
            {LEAGUES.map((l) => (
              <button
                key={l.key}
                onClick={() => setLeague(l.key)}
                className="relative rounded-lg px-4 py-1.5 text-xs font-bold tracking-widest transition-all duration-300"
                style={
                  league === l.key
                    ? { backgroundColor: l.accent, color: "oklch(0.18 0.01 260)", boxShadow: `0 0 24px -6px ${l.glow}` }
                    : { color: "var(--color-race-muted)" }
                }
              >
                {l.name}
              </button>
            ))}
          </div>
          <TimeFilter value={period} onChange={setPeriod} date={date} onDate={setDate} />
        </div>

        <div key={league} className="page-enter px-4 py-6 lg:px-8">
          {/* Sarlavha */}
          <div className="mb-6 flex items-center gap-4">
            <div
              className="grid h-14 w-14 shrink-0 place-items-center rounded-xl text-xl font-black"
              style={{ background: `linear-gradient(140deg, ${meta.accent}, ${meta.glow})`, color: "#17181c" }}
            >
              {meta.name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight lg:text-4xl" style={{ color: meta.accent }}>
                {meta.name} LEAGUE
              </h1>
              <p className="text-[11px] uppercase tracking-[0.28em] text-race-muted">{meta.slogan}</p>
              <p className="mt-1 text-xs font-bold tracking-[0.3em] text-race-muted">{PERIOD_LABEL}</p>
            </div>
          </div>

          {/* 1-o'rin bloki */}
          <Reveal>
            <div
              className="podium-glow relative mb-5 overflow-hidden rounded-xl"
              style={{
                background:
                  "linear-gradient(96deg, var(--color-race-red) 0%, var(--color-race-red) 58%, color-mix(in oklab, var(--race-red-deep) 90%, black) 100%)",
                clipPath: "polygon(0 0, 100% 0, calc(100% - 40px) 100%, 0 100%)",
              }}
            >
              <div className="flex flex-wrap items-center gap-6 px-6 py-6 lg:px-10 lg:py-8">
                <span className="text-6xl font-black leading-none lg:text-8xl">1</span>
                <div
                  className="h-28 w-28 shrink-0 overflow-hidden rounded-full lg:h-36 lg:w-36"
                  style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,.14), transparent 70%)" }}
                >
                  <img src={leader.avatar} alt={leader.fullName} className="cutout-avatar h-full w-full" />
                </div>
                <div className="min-w-[180px] flex-1">
                  <p className="text-2xl font-black uppercase leading-tight tracking-tight lg:text-4xl">
                    {leader.fullName}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/75">
                    Supervayzer: {leader.supervisor}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-5 text-xs uppercase tracking-widest text-white/75">
                    <span>
                      Reyting ball: <b className="text-white">{leader.points}</b>
                    </span>
                    <span>
                      Bugun: <b className="text-white">{leader.today}</b>
                    </span>
                    <span>
                      Kecha: <b className="text-white">{leader.yesterday}</b>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black tabular-nums lg:text-6xl">
                    <CountUp value={leader.percent} decimals={1} suffix="%" />
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/70">Plan bajarish</p>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Qolgan o'rinlar */}
          <div className="space-y-1.5">
            {rest.map((r, i) => {
              const inDanger = league !== "rising" && r.place >= 23;
              return (
                <div key={r.id}>
                  <Reveal delay={Math.min(i * 45, 500)}>
                    <div className={`race-row ${inDanger ? "race-row-danger" : ""} rounded-md`}>
                      <span className="h-11 w-1.5 shrink-0 rounded-r" style={{ backgroundColor: r.stripe }} />
                      <span className="w-10 shrink-0 text-center text-2xl font-black tabular-nums">{r.place}</span>
                      <img
                        src={r.avatar}
                        alt={r.fullName}
                        className="cutout-avatar h-11 w-11 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold uppercase tracking-wide">{r.fullName}</p>
                        <p className="truncate text-[11px] text-white/70">Supervayzer: {r.supervisor}</p>
                      </div>
                      <div className="hidden w-24 text-right sm:block">
                        <p className="text-[10px] uppercase tracking-widest text-white/60">Reyting ball</p>
                        <p className="text-sm font-bold tabular-nums">{r.points}</p>
                      </div>
                      <div className="hidden w-16 text-right md:block">
                        <p className="text-[10px] uppercase tracking-widest text-white/60">Bugun</p>
                        <p className="text-sm font-bold tabular-nums">{r.today}</p>
                      </div>
                      <div className="hidden w-16 text-right md:block">
                        <p className="text-[10px] uppercase tracking-widest text-white/60">Kecha</p>
                        <p className="text-sm font-bold tabular-nums">{r.yesterday}</p>
                      </div>
                      <div className="flex w-28 items-center justify-end gap-2">
                        <Trend today={r.today} yesterday={r.yesterday} />
                        <span className="text-lg font-black tabular-nums">{r.percent}%</span>
                      </div>
                    </div>
                  </Reveal>

                  {league !== "diamond" && r.place === 5 ? (
                    <ZoneLine tone="up" label="Ko'tarilish zonasi — 1–5 o'rin keyingi oy yuqori ligaga" />
                  ) : null}
                  {league !== "rising" && r.place === 22 ? (
                    <ZoneLine tone="down" label="Pasayish zonasi — 23–27 o'rin keyingi oy pastroq ligaga" />
                  ) : null}
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-[11px] leading-relaxed text-race-muted">
            Reyting ball — mavsum davomida yig'iladigan MICCO ichki ball tizimi (1-o'rin 24 ball, 2-o'rin 22, 3-o'rin
            20, so'ng har o'ringa −1, 23-o'rin va undan past 0 ball).
          </p>
        </div>
      </div>
    </AppShell>
  );
}

function ZoneLine({ tone, label }: { tone: "up" | "down"; label: string }) {
  const color = tone === "up" ? "var(--color-success)" : "var(--color-danger)";
  return (
    <Reveal>
      <div className="my-2 flex items-center gap-3">
        <span className="trend-arrow text-sm font-bold" style={{ color }}>
          {tone === "up" ? "▲" : "▼"}
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
          style={{ color, border: `1px solid ${color}`, backgroundColor: `color-mix(in oklab, ${color} 14%, transparent)` }}
        >
          {label}
        </span>
        <span className="h-0.5 flex-1 rounded-full" style={{ backgroundColor: color }} />
      </div>
    </Reveal>
  );
}
