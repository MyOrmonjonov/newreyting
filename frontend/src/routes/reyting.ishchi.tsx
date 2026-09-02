import { createFileRoute } from "@tanstack/react-router";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { animate } from "animejs";
import {
  Star,
  TrendingUp,
  History,
  Percent,
  Trophy,
  CalendarDays,
  Medal,
  Award,
  ChevronsUp,
  ChevronsDown,
  Gem,
  Crown,
  Shield,
  Circle,
  type LucideIcon,
} from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { CountUp, Reveal, Trend } from "@/components/motion";
import { RankedDetailModal, type RankedDetailItem } from "@/components/RankedDetailModal";
import { PodiumSlot } from "@/components/Podium";
import { LEAGUES, MONTHS, AGENT_LEAGUE_POINTS, type LeagueKey } from "@/lib/micco-data";
import { api } from "@/lib/api";
import { avatarFor, monthParam, type AgentApiRow } from "@/lib/rating-api";
import { cn } from "@/lib/utils";
import { usePersistentState } from "@/lib/use-persistent-state";

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

// TV/monitor ekranida ko'rsatish uchun — sahifani qo'lda yangilamasdan, o'zi
// vaqti-vaqti bilan yangi ma'lumot bor-yo'qligini tekshirib turadi.
const LIVE_REFRESH_MS = 5_000;

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

const LEAGUE_ICONS: Record<LeagueKey, LucideIcon> = {
  diamond: Gem,
  gold: Crown,
  silver: Circle,
  bronze: Shield,
  rising: TrendingUp,
};

function AgentRating() {
  const [league, setLeague] = usePersistentState<LeagueKey>("micco-reyting-ishchi-league", "diamond");
  const [view, setView] = usePersistentState<"oylik" | "yillik">("micco-reyting-ishchi-view", "oylik");
  const [date, setDate] = usePersistentState("micco-reyting-ishchi-date", "2026-07-28");
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
        { label: "Necha yildan beri", value: selected.yearsActive, icon: CalendarDays },
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
    refetchInterval: LIVE_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

  const { data: allYillikAgents = [] } = useQuery({
    queryKey: ["reyting", "ishchi", "yillik", yil],
    queryFn: () => api.get<YillikIshchiApiRow[]>(`/api/reyting/ishchi/yillik?yil=${yil}`),
    enabled: view === "yillik",
    refetchInterval: LIVE_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

  const meta = LEAGUES.find((l) => l.key === league)!;
  const leaguePoints = AGENT_LEAGUE_POINTS[league];
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

  const leader = rows[0];
  const second = rows[1];
  const third = rows[2];
  const hasPodium = Boolean(leader && second && third);
  const listRows = hasPodium ? rows.slice(3) : rows.slice(1);

  // FLIP: har LIVE_REFRESH_MS'da yangi ma'lumot kelganda o'rin almashgan qatorlar
  // sakrab qolmasdan, eski joyidan yangi joyiga sirg'alib boradi (jonli tablo hissi).
  const rowElsRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const prevTopsRef = useRef<Map<number, number>>(new Map());
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      prevTopsRef.current.clear();
      return;
    }
    const prevTops = prevTopsRef.current;
    const nextTops = new Map<number, number>();
    for (const r of listRows) {
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
    <PublicShell
      onResetFilters={() => {
        setLeague("diamond");
        setView("oylik");
        setDate("2026-07-28");
      }}
      filters={
        <div className="space-y-4">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-race-muted">
              Darajalar
            </p>
            <div className="grid grid-cols-2 gap-2">
              {LEAGUES.map((l, i) => {
                const Icon = LEAGUE_ICONS[l.key];
                return (
                  <button
                    key={l.key}
                    onClick={() => setLeague(l.key)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-all duration-300",
                      i === LEAGUES.length - 1 && LEAGUES.length % 2 === 1 ? "col-span-2" : "",
                    )}
                    style={
                      league === l.key
                        ? {
                            backgroundColor: `color-mix(in oklab, ${l.accent} 20%, transparent)`,
                            borderColor: l.accent,
                            color: l.accent,
                            boxShadow: `0 0 16px -4px ${l.glow}`,
                          }
                        : {
                            backgroundColor: `color-mix(in oklab, ${l.accent} 8%, transparent)`,
                            borderColor: `color-mix(in oklab, ${l.accent} 30%, transparent)`,
                            color: `color-mix(in oklab, ${l.accent} 75%, white)`,
                          }
                    }
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {l.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-race-muted">Davr</p>
            <div className="mb-2 flex rounded-xl border border-white/15 bg-white/5 p-1">
              {(["oylik", "yillik"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="flex-1 rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-all duration-300"
                  style={
                    view === v
                      ? {
                          background: "linear-gradient(90deg, var(--color-accent-cyan), var(--color-brand))",
                          color: "white",
                          boxShadow: "0 0 16px -4px var(--color-brand)",
                        }
                      : { color: "var(--color-race-muted)" }
                  }
                >
                  {v}
                </button>
              ))}
            </div>
            {view === "oylik" ? (
              <div className="w-full overflow-hidden rounded-xl border border-white/15 bg-white/5 transition-colors focus-within:border-brand">
                <input
                  type="month"
                  value={date.slice(0, 7)}
                  onChange={(e) => setDate(`${e.target.value}-01`)}
                  className="block w-full max-w-full border-0 bg-transparent px-3 py-2 text-sm text-race-fg outline-none"
                />
              </div>
            ) : (
              <div className="w-full overflow-hidden rounded-xl border border-white/15 bg-white/5 transition-colors focus-within:border-brand">
                <input
                  type="number"
                  value={yil}
                  onChange={(e) => setDate(`${e.target.value || yil}-01-28`)}
                  className="block w-full max-w-full border-0 bg-transparent px-3 py-2 text-sm text-race-fg outline-none"
                />
              </div>
            )}
          </div>
        </div>
      }
    >
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.02]">
        {/* Liga navigatsiyasi — desktop/tablet; mobilda PublicShell'ning "Filterlar" kartasi ishlatiladi */}
        <div className="hidden flex-wrap items-center justify-center gap-4 border-b border-white/10 px-5 py-5 sm:flex">
          <div className="scrollbar-none relative flex max-w-full flex-wrap justify-center gap-2 overflow-x-auto">
            {LEAGUES.map((l) => {
              const Icon = LEAGUE_ICONS[l.key];
              return (
                <button
                  key={l.key}
                  onClick={() => setLeague(l.key)}
                  className="league-pill flex items-center gap-1.5"
                  style={
                    league === l.key
                      ? {
                          backgroundColor: `color-mix(in oklab, ${l.accent} 20%, transparent)`,
                          borderColor: l.accent,
                          color: l.accent,
                          boxShadow: `0 0 24px -8px ${l.glow}`,
                        }
                      : {
                          backgroundColor: `color-mix(in oklab, ${l.accent} 8%, transparent)`,
                          borderColor: `color-mix(in oklab, ${l.accent} 30%, transparent)`,
                          color: `color-mix(in oklab, ${l.accent} 75%, white)`,
                        }
                  }
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {l.name}
                </button>
              );
            })}
          </div>
          <div className="flex w-full flex-wrap items-center justify-center gap-3 sm:w-auto sm:justify-end">
            <div className="flex rounded-xl border border-white/15 bg-white/5 p-1">
              {(["oylik", "yillik"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300"
                  style={
                    view === v
                      ? {
                          background: "linear-gradient(90deg, var(--color-accent-cyan), var(--color-brand))",
                          color: "white",
                          boxShadow: "0 0 16px -4px var(--color-brand)",
                        }
                      : { color: "var(--color-race-muted)" }
                  }
                >
                  {v}
                </button>
              ))}
            </div>
            {view === "oylik" ? (
              <div className="overflow-hidden rounded-xl border border-white/15 bg-white/5 transition-colors focus-within:border-brand">
                <input
                  type="month"
                  value={date.slice(0, 7)}
                  onChange={(e) => setDate(`${e.target.value}-01`)}
                  className="block max-w-full border-0 bg-transparent px-3 py-2 text-sm text-race-fg outline-none"
                />
              </div>
            ) : (
              <div className="w-24 overflow-hidden rounded-xl border border-white/15 bg-white/5 transition-colors focus-within:border-brand">
                <input
                  type="number"
                  value={yil}
                  onChange={(e) => setDate(`${e.target.value || yil}-01-28`)}
                  className="block w-full max-w-full border-0 bg-transparent px-3 py-2 text-sm text-race-fg outline-none"
                />
              </div>
            )}
          </div>
        </div>

        <div key={league} className="page-enter px-4 py-6 lg:px-8">
          {/* Sarlavha */}
          <div className="mb-6 flex items-center justify-center gap-2 text-center sm:mb-8">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.accent }} />
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-race-muted">
              {meta.name} · {view === "oylik" ? formatOyLabel(oy) : `${yil}-yil yakuni`}
            </p>
          </div>

          {view === "yillik" ? (
            yillikRows.length ? (
              <div className="space-y-1.5">
                {yillikRows.map((r) => (
                  <div
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedYillik(r)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedYillik(r)}
                    className={`card-row cursor-pointer active:scale-[0.99] ${r.place === 1 ? "podium-glow" : ""}`}
                    style={
                      r.place === 1
                        ? { borderColor: "color-mix(in oklab, var(--color-accent-gold) 45%, transparent)" }
                        : undefined
                    }
                  >
                    <span className="w-6 shrink-0 text-center text-base font-black tabular-nums sm:w-10 sm:text-2xl">
                      {r.place}
                    </span>
                    <img
                      src={r.avatar}
                      alt={r.fullName}
                      className="avatar-ring h-8 w-8 shrink-0 sm:h-11 sm:w-11"
                      style={{
                        borderColor: r.place === 1 ? "var(--color-accent-warm)" : "color-mix(in oklab, white 20%, transparent)",
                      }}
                    />
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
                ))}
              </div>
            ) : (
              <p className="py-16 text-center text-sm text-race-muted">
                Bu ligada hali ishchi yo'q.
              </p>
            )
          ) : leader ? (
          <>
          {/* Podium — top 3 o'rin */}
          {hasPodium ? (
            <div className="mb-8 flex items-end justify-center gap-3 sm:gap-8">
              <PodiumSlot
                avatar={second!.avatar}
                name={second!.fullName}
                percent={second!.percent}
                rank={2}
                size="sm"
                avatarRef={() => {}}
                onSelect={() => setSelected(second!)}
              />
              <PodiumSlot
                avatar={leader.avatar}
                name={leader.fullName}
                percent={leader.percent}
                rank={1}
                size="lg"
                crown
                avatarRef={() => {}}
                onSelect={() => setSelected(leader)}
              />
              <PodiumSlot
                avatar={third!.avatar}
                name={third!.fullName}
                percent={third!.percent}
                rank={3}
                size="sm"
                avatarRef={() => {}}
                onSelect={() => setSelected(third!)}
              />
            </div>
          ) : (
            <Reveal>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setSelected(leader)}
                onKeyDown={(e) => e.key === "Enter" && setSelected(leader)}
                className="card-row podium-glow mb-5 cursor-pointer active:scale-[0.99]"
                style={{ borderColor: "color-mix(in oklab, var(--color-accent-gold) 45%, transparent)" }}
              >
                <span className="w-8 shrink-0 text-center text-2xl font-black tabular-nums">1</span>
                <img
                  src={leader.avatar}
                  alt={leader.fullName}
                  className="avatar-ring h-14 w-14 shrink-0"
                  style={{ borderColor: "var(--color-accent-gold)" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold uppercase tracking-wide">{leader.fullName}</p>
                  <p className="truncate text-[11px] text-race-muted">Supervayzer: {leader.supervisor}</p>
                </div>
                <span className="text-2xl font-black tabular-nums">
                  <CountUp value={leader.percent} decimals={1} suffix="%" />
                </span>
              </div>
            </Reveal>
          )}

          {/* Qolgan o'rinlar */}
          <div className="space-y-2">
            {listRows.map((r) => {
              // Nizomga ko'ra: har liga 27 kishilik — top-5 (1-5) ko'tariladi,
              // oxirgi 5 (23-27) pastroq ligaga tushadi (o'rin qat'iy, joriy son emas).
              const DANGER_BOUNDARY = 22;
              const inPromo = league !== "diamond" && r.place <= 5;
              const inDanger = league !== "rising" && r.place > DANGER_BOUNDARY;
              return (
                <div
                  key={r.id}
                  ref={(el) => {
                    if (el) rowElsRef.current.set(r.id, el);
                    else rowElsRef.current.delete(r.id);
                  }}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelected(r)}
                    onKeyDown={(e) => e.key === "Enter" && setSelected(r)}
                    className={`card-row ${inPromo ? "card-row-promo" : ""} ${inDanger ? "card-row-danger" : ""} cursor-pointer active:scale-[0.99]`}
                  >
                    <span className="flex w-4 shrink-0 justify-center">
                      {inPromo ? (
                        <ChevronsUp className="zone-chevrons-up h-4 w-4 text-success" />
                      ) : inDanger ? (
                        <ChevronsDown className="zone-chevrons-down h-4 w-4 text-danger" />
                      ) : null}
                    </span>
                    <span className="w-6 shrink-0 text-center text-base font-black tabular-nums sm:w-10 sm:text-2xl">
                      {r.place}
                    </span>
                    <img
                      src={r.avatar}
                      alt={r.fullName}
                      className="avatar-ring h-8 w-8 shrink-0 sm:h-11 sm:w-11"
                      style={{ borderColor: "color-mix(in oklab, white 20%, transparent)" }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold uppercase tracking-wide sm:text-sm">
                        {r.fullName}
                      </p>
                      <p className="truncate text-[10px] text-race-muted sm:text-[11px]">
                        Supervayzer: {r.supervisor}
                      </p>
                    </div>
                    <div className="hidden w-24 text-right sm:block">
                      <p className="text-[10px] uppercase tracking-widest text-race-muted">Reyting ball</p>
                      <p className="text-sm font-bold tabular-nums">{r.points}</p>
                    </div>
                    <div className="hidden w-16 text-right md:block">
                      <p className="text-[10px] uppercase tracking-widest text-race-muted">Bugun</p>
                      <p className="text-sm font-bold tabular-nums">{r.today}</p>
                    </div>
                    <div className="hidden w-16 text-right md:block">
                      <p className="text-[10px] uppercase tracking-widest text-race-muted">Kecha</p>
                      <p className="text-sm font-bold tabular-nums">{r.yesterday}</p>
                    </div>
                    <div className="flex w-14 shrink-0 items-center justify-end gap-1 sm:w-28 sm:gap-2">
                      <Trend today={r.today} yesterday={r.yesterday} />
                      <span className="text-sm font-black tabular-nums sm:text-lg">{r.percent}%</span>
                    </div>
                  </div>

                  {league !== "diamond" && r.place === 5 ? (
                    <ZoneLine tone="up" />
                  ) : null}
                  {league !== "rising" && r.place === DANGER_BOUNDARY ? (
                    <ZoneLine tone="down" />
                  ) : null}
                </div>
              );
            })}
          </div>

          <p className="mt-6 text-[11px] leading-relaxed text-race-muted">
            Reyting ball — {meta.name} ligasi: 1-o'rin {leaguePoints.p1} ball, 2-o'rin {leaguePoints.p2}, 3-o'rin{" "}
            {leaguePoints.p3}, so'ng har o'ringa −1, {leaguePoints.floor} balldan pastga tushmaydi.
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

function ZoneLine({ tone }: { tone: "up" | "down" }) {
  const color = tone === "up" ? "var(--color-success)" : "var(--color-danger)";
  return (
    <Reveal>
      <div className="my-2 flex items-center gap-2 sm:gap-3">
        <span className="trend-arrow shrink-0 text-xs font-semibold sm:text-sm sm:font-bold" style={{ color }}>
          {tone === "up" ? "▲" : "▼"}
        </span>
        <span className="h-px flex-1 rounded-full sm:h-0.5" style={{ backgroundColor: color }} />
      </div>
    </Reveal>
  );
}
