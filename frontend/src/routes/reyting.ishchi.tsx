import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { animate, stagger } from "animejs";
import { Star, TrendingUp, History, Percent, Trophy, CalendarDays, Medal, Award } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { CountUp, Reveal, Trend } from "@/components/motion";
import { RankedDetailModal, type RankedDetailItem } from "@/components/RankedDetailModal";
import { LEAGUES, MONTHS, type LeagueKey } from "@/lib/micco-data";
import { api } from "@/lib/api";
import { avatarFor, monthParam, stripeFor, type AgentApiRow } from "@/lib/rating-api";

type Agent = {
  id: number;
  place: number;
  fullName: string;
  supervisor: string;
  percent: number;
  points: number;
  today: number;
  yesterday: number;
  avatar: string;
  stripe: string;
  trophies: number;
  yearsActive: number;
  league: AgentApiRow["league"];
};

type YillikIshchiApiRow = {
  id: number;
  fullName: string;
  supervisorFullName: string;
  rasm: string | null;
  league: AgentApiRow["league"];
  place: number;
  nomination: string | null;
  totalBall: number;
  firstPlaces: number;
  secondPlaces: number;
  thirdPlaces: number;
  avgPercent: number;
};

type YillikAgent = {
  id: number;
  place: number;
  fullName: string;
  supervisor: string;
  avatar: string;
  nomination: string | null;
  totalBall: number;
  firstPlaces: number;
  secondPlaces: number;
  thirdPlaces: number;
  avgPercent: number;
};

function formatOyLabel(oy: string): string {
  const [year, month] = oy.split("-");
  return `${year} ${MONTHS[Number(month) - 1]?.toUpperCase() ?? month}`;
}

function toAgent(row: AgentApiRow): Agent {
  return {
    id: row.id,
    place: row.place,
    fullName: row.fullName,
    supervisor: row.supervisorFullName,
    percent: row.percent,
    points: row.points,
    today: row.today,
    yesterday: row.yesterday,
    avatar: row.rasm || avatarFor(`${row.fullName}-${row.id}`),
    stripe: stripeFor(row.id),
    trophies: row.trophies,
    yearsActive: row.yearsActive,
    league: row.league,
  };
}

function toYillikAgent(row: YillikIshchiApiRow): YillikAgent {
  return {
    id: row.id,
    place: row.place,
    fullName: row.fullName,
    supervisor: row.supervisorFullName,
    avatar: row.rasm || avatarFor(`${row.fullName}-${row.id}`),
    nomination: row.nomination,
    totalBall: row.totalBall,
    firstPlaces: row.firstPlaces,
    secondPlaces: row.secondPlaces,
    thirdPlaces: row.thirdPlaces,
    avgPercent: row.avgPercent,
  };
}

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
  const [view, setView] = useState<"oylik" | "yillik">("oylik");
  const [date, setDate] = useState("2026-07-28");
  const [selected, setSelected] = useState<Agent | null>(null);
  const [selectedYillik, setSelectedYillik] = useState<YillikAgent | null>(null);
  const oy = monthParam(date);
  const yil = Number(date.slice(0, 4));

  const selectedDetail: RankedDetailItem | null = useMemo(() => {
    if (selectedYillik) {
      return {
        name: selectedYillik.fullName,
        avatar: selectedYillik.avatar,
        place: selectedYillik.place,
        percent: selectedYillik.avgPercent,
        subtitle2: `Supervayzer: ${selectedYillik.supervisor}`,
        stats: [
          { label: "Jami ball", value: selectedYillik.totalBall, icon: Star },
          { label: "O'rtacha %", value: `${selectedYillik.avgPercent}%`, icon: Percent },
          { label: "1-o'rinlar", value: selectedYillik.firstPlaces, icon: Trophy },
          { label: "2-o'rinlar", value: selectedYillik.secondPlaces, icon: Medal },
          { label: "3-o'rinlar", value: selectedYillik.thirdPlaces, icon: Award },
        ],
      };
    }
    if (!selected) return null;
    return {
      name: selected.fullName,
      avatar: selected.avatar,
      place: selected.place,
      percent: selected.percent,
      subtitle2: `Supervayzer: ${selected.supervisor}`,
      stats: [
        { label: "Reyting ball", value: selected.points, icon: Star },
        { label: "Bugun", value: selected.today, icon: TrendingUp },
        { label: "Kecha", value: selected.yesterday, icon: History },
        { label: "Foizi", value: `${selected.percent}%`, icon: Percent },
        { label: "Nechta kubok", value: selected.trophies, icon: Trophy },
        { label: "Necha yildan beri", value: `${selected.yearsActive} yil`, icon: CalendarDays },
      ],
    };
  }, [selected, selectedYillik]);

  function closeDetail() {
    setSelected(null);
    setSelectedYillik(null);
  }

  const { data: allAgents = [] } = useQuery({
    queryKey: ["reyting", "ishchi", oy],
    queryFn: () => api.get<AgentApiRow[]>(`/api/reyting/ishchi?oy=${oy}`),
    enabled: view === "oylik",
  });

  const { data: allYillikAgents = [] } = useQuery({
    queryKey: ["reyting", "ishchi", "yillik", yil],
    queryFn: () => api.get<YillikIshchiApiRow[]>(`/api/reyting/ishchi/yillik?yil=${yil}`),
    enabled: view === "yillik",
  });

  const meta = LEAGUES.find((l) => l.key === league)!;
  const rows = useMemo(
    () => allAgents.filter((r) => r.league === league).map(toAgent),
    [allAgents, league],
  );
  const yillikRows = useMemo(
    () =>
      allYillikAgents
        .filter((r) => r.league === league)
        .map(toYillikAgent)
        .sort((a, b) => a.place - b.place),
    [allYillikAgents, league],
  );

  const leagueSize = rows.length;
  const leader = rows[0];
  const rest = rows.slice(1);

  const leaderAvatarRef = useRef<HTMLImageElement | null>(null);
  const rowAvatarRefs = useRef<(HTMLImageElement | null)[]>([]);

  // Reytingdagi odamlar "jim" turmasin — har bir avatar sekin, tartibsiz
  // (staggered) suzib-nafas oladi. Faqat transform animatsiya qilinadi (GPU-friendly).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    if (leaderAvatarRef.current) {
      animate(leaderAvatarRef.current, {
        translateY: [0, -7, 0],
        loop: true,
        duration: 2600,
        ease: "inOutSine",
      });
    }

    const avatars = rowAvatarRefs.current.filter((el): el is HTMLImageElement => el !== null);
    if (avatars.length) {
      animate(avatars, {
        translateY: [0, -4, 0],
        loop: true,
        duration: 2100,
        delay: stagger(90, { start: 150, from: "first" }),
        ease: "inOutSine",
      });
    }
  }, [rows]);

  return (
    <PublicShell>
      <div className="overflow-hidden rounded-2xl border border-white/10">
        {/* Liga navigatsiyasi */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="scrollbar-none relative flex max-w-full gap-1 overflow-x-auto rounded-xl bg-white/5 p-1">
            {LEAGUES.map((l) => (
              <button
                key={l.key}
                onClick={() => setLeague(l.key)}
                className="relative shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-bold tracking-widest transition-all duration-300 sm:px-4 sm:text-xs"
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
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-xl border border-white/15 bg-white/5 p-1">
              {(["oylik", "yillik"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300"
                  style={
                    view === v
                      ? { backgroundColor: "var(--color-race-red)", color: "white" }
                      : { color: "var(--color-race-muted)" }
                  }
                >
                  {v}
                </button>
              ))}
            </div>
            {view === "oylik" ? (
              <input
                type="month"
                value={date.slice(0, 7)}
                onChange={(e) => setDate(`${e.target.value}-01`)}
                className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-race-fg outline-none transition-colors focus:border-brand"
              />
            ) : (
              <input
                type="number"
                value={yil}
                onChange={(e) => setDate(`${e.target.value || yil}-01-28`)}
                className="w-24 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-race-fg outline-none transition-colors focus:border-brand"
              />
            )}
          </div>
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
              <p className="mt-1 text-xs font-bold tracking-[0.3em] text-race-muted">
                {view === "oylik" ? formatOyLabel(oy) : `${yil}-YIL YAKUNI`}
              </p>
            </div>
          </div>

          {view === "yillik" ? (
            yillikRows.length ? (
              <div className="space-y-1.5">
                {yillikRows.map((r, i) => (
                  <Reveal key={r.id} delay={Math.min(i * 45, 500)}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedYillik(r)}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedYillik(r)}
                      className={`race-row cursor-pointer rounded-md transition-transform duration-200 active:scale-[0.99] ${
                        r.place === 1 ? "podium-glow" : ""
                      }`}
                    >
                      <span
                        className="h-8 w-1.5 shrink-0 rounded-r sm:h-11"
                        style={{ backgroundColor: r.place === 1 ? meta.accent : "rgba(255,255,255,.5)" }}
                      />
                      <span className="w-6 shrink-0 text-center text-base font-black tabular-nums sm:w-10 sm:text-2xl">
                        {r.place}
                      </span>
                      <img src={r.avatar} alt={r.fullName} className="cutout-avatar h-8 w-8 shrink-0 sm:h-11 sm:w-11" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold uppercase tracking-wide sm:text-sm">{r.fullName}</p>
                        <p className="truncate text-[10px] text-white/70 sm:text-[11px]">
                          {r.nomination ?? `Supervayzer: ${r.supervisor}`}
                        </p>
                      </div>
                      <div className="hidden w-16 text-right md:block">
                        <p className="text-[10px] uppercase tracking-widest text-white/60">1-o'rin</p>
                        <p className="text-sm font-bold tabular-nums">{r.firstPlaces}</p>
                      </div>
                      <div className="hidden w-20 text-right sm:block">
                        <p className="text-[10px] uppercase tracking-widest text-white/60">O'rtacha %</p>
                        <p className="text-sm font-bold tabular-nums">{r.avgPercent}%</p>
                      </div>
                      <div className="w-16 shrink-0 text-right sm:w-24">
                        <p className="text-[10px] uppercase tracking-widest text-white/60">Jami ball</p>
                        <p className="text-base font-black tabular-nums sm:text-xl">{r.totalBall}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-race-muted">
                Bu ligada hali ishchi yo'q.
              </p>
            )
          ) : leader ? (
          <>
          {/* 1-o'rin bloki */}
          <Reveal>
            <div
              role="button"
              tabIndex={0}
              onClick={() => setSelected(leader)}
              onKeyDown={(e) => e.key === "Enter" && setSelected(leader)}
              className="podium-glow relative mb-5 cursor-pointer overflow-hidden rounded-xl transition-transform duration-300 active:scale-[0.99]"
              style={{
                background:
                  "linear-gradient(96deg, var(--color-race-red) 0%, var(--color-race-red) 58%, color-mix(in oklab, var(--race-red-deep) 90%, black) 100%)",
                clipPath: "polygon(0 0, 100% 0, calc(100% - 40px) 100%, 0 100%)",
              }}
            >
              <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
                <span className="text-4xl font-black leading-none sm:text-6xl lg:text-8xl">1</span>
                <div
                  className="h-16 w-16 shrink-0 overflow-hidden rounded-full sm:h-28 sm:w-28 lg:h-36 lg:w-36"
                  style={{ background: "radial-gradient(circle at 50% 40%, rgba(255,255,255,.14), transparent 70%)" }}
                >
                  <img
                    ref={leaderAvatarRef}
                    src={leader.avatar}
                    alt={leader.fullName}
                    className="cutout-avatar h-full w-full"
                  />
                </div>
                <div className="min-w-[140px] flex-1">
                  <p className="text-base font-black uppercase leading-tight tracking-tight sm:text-2xl lg:text-4xl">
                    {leader.fullName}
                  </p>
                  <p className="mt-1 truncate text-[10px] uppercase tracking-[0.2em] text-white/75 sm:text-xs">
                    Supervayzer: {leader.supervisor}
                  </p>
                  <div className="mt-2 hidden flex-wrap gap-5 text-xs uppercase tracking-widest text-white/75 sm:mt-3 sm:flex">
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
                  <p className="text-2xl font-black tabular-nums sm:text-4xl lg:text-6xl">
                    <CountUp value={leader.percent} decimals={1} suffix="%" />
                  </p>
                  <p className="hidden text-[10px] uppercase tracking-[0.25em] text-white/70 sm:block">
                    Plan bajarish
                  </p>
                </div>
              </div>
              <p className="border-t border-white/10 px-4 py-2 text-center text-[10px] uppercase tracking-widest text-white/60 sm:hidden">
                To'liq ma'lumot uchun bosing
              </p>
            </div>
          </Reveal>

          {/* Qolgan o'rinlar */}
          <div className="space-y-1.5">
            {rest.map((r, i) => {
              const showZones = leagueSize >= 10;
              const dangerBoundary = leagueSize - 5;
              const inDanger = league !== "rising" && showZones && r.place > dangerBoundary;
              return (
                <div key={r.id}>
                  <Reveal delay={Math.min(i * 45, 500)}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelected(r)}
                      onKeyDown={(e) => e.key === "Enter" && setSelected(r)}
                      className={`race-row ${inDanger ? "race-row-danger" : ""} cursor-pointer rounded-md transition-transform duration-200 active:scale-[0.99]`}
                    >
                      <span className="h-8 w-1.5 shrink-0 rounded-r sm:h-11" style={{ backgroundColor: r.stripe }} />
                      <span className="w-6 shrink-0 text-center text-base font-black tabular-nums sm:w-10 sm:text-2xl">
                        {r.place}
                      </span>
                      <img
                        ref={(el) => {
                          rowAvatarRefs.current[i] = el;
                        }}
                        src={r.avatar}
                        alt={r.fullName}
                        className="cutout-avatar h-8 w-8 shrink-0 sm:h-11 sm:w-11"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold uppercase tracking-wide sm:text-sm">
                          {r.fullName}
                        </p>
                        <p className="truncate text-[10px] text-white/70 sm:text-[11px]">
                          Supervayzer: {r.supervisor}
                        </p>
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
                      <div className="flex w-14 shrink-0 items-center justify-end gap-1 sm:w-28 sm:gap-2">
                        <Trend today={r.today} yesterday={r.yesterday} />
                        <span className="text-sm font-black tabular-nums sm:text-lg">{r.percent}%</span>
                      </div>
                    </div>
                  </Reveal>

                  {showZones && league !== "diamond" && r.place === 5 ? (
                    <ZoneLine tone="up" label="Ko'tarilish zonasi — top 5 o'rin keyingi oy yuqori ligaga" />
                  ) : null}
                  {showZones && league !== "rising" && r.place === dangerBoundary ? (
                    <ZoneLine tone="down" label="Pasayish zonasi — oxirgi 5 o'rin keyingi oy pastroq ligaga" />
                  ) : null}
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-[11px] leading-relaxed text-race-muted">
            Reyting ball — mavsum davomida yig'iladigan MICCO ichki ball tizimi (1-o'rin 24 ball, 2-o'rin 22, 3-o'rin
            20, so'ng har o'ringa −1, 23-o'rin va undan past 0 ball).
          </p>
          </>
          ) : (
            <p className="py-16 text-center text-sm text-race-muted">
              Bu ligada hali ishchi yo'q — operator paneli orqali ishchi va oylik natija kiritilganda shu yerda chiqadi.
            </p>
          )}
        </div>
      </div>

      <RankedDetailModal
        item={selectedDetail}
        subtitle={selectedYillik ? `${yil}-yil` : formatOyLabel(oy)}
        onClose={closeDetail}
      />
    </PublicShell>
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
