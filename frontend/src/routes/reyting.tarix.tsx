import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, ShieldCheck, Briefcase, Gem, Crown, Circle, Shield, TrendingUp, type LucideIcon } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { LEAGUES, MONTHS, type LeagueKey } from "@/lib/micco-data";
import { api } from "@/lib/api";
import { avatarFor } from "@/lib/rating-api";
import { usePersistentState } from "@/lib/use-persistent-state";
import { cn } from "@/lib/utils";

type Rol = "ishchi" | "supervayzer" | "menejer";

const ROLES: { key: Rol; label: string; icon: LucideIcon; path: string }[] = [
  { key: "ishchi", label: "Agent", icon: User, path: "ishchi" },
  { key: "supervayzer", label: "Supervayzer", icon: ShieldCheck, path: "supervayzer" },
  { key: "menejer", label: "Menejer", icon: Briefcase, path: "menejer" },
];

const LEAGUE_ICONS: Record<LeagueKey, LucideIcon> = {
  diamond: Gem,
  gold: Crown,
  silver: Circle,
  bronze: Shield,
  rising: TrendingUp,
};

type PersonRow = {
  id: number;
  fullName: string;
  avatar: string;
  months: (number | null)[]; // 12 ta, har biri o'sha oydagi o'rin (yo'q bo'lsa null)
};

type IshchiTarixApiRow = { id: number; fullName: string; rasm: string | null; placesByMonth: (number | null)[] };
type RahbarTarixApiRow = { id: number; fullName: string; placesByMonth: (number | null)[] };

async function fetchIshchiMatrix(yil: number, league: LeagueKey): Promise<PersonRow[]> {
  const rows = await api.get<IshchiTarixApiRow[]>(`/api/reyting/ishchi/tarix-yillik-matritsa?yil=${yil}&liga=${league}`);
  return rows.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    avatar: r.rasm || avatarFor(`${r.fullName}-${r.id}`),
    months: r.placesByMonth,
  }));
}

async function fetchRahbarMatrix(yil: number, path: "supervayzer" | "menejer"): Promise<PersonRow[]> {
  const rows = await api.get<RahbarTarixApiRow[]>(`/api/reyting/${path}/tarix-yillik-matritsa?yil=${yil}`);
  return rows.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    avatar: avatarFor(`${r.fullName}-${r.id}`),
    months: r.placesByMonth,
  }));
}

function placeCellStyle(place: number | null): { color: string; fontWeight?: number } {
  if (place === 1) return { color: "var(--color-accent-gold)", fontWeight: 900 };
  if (place === 2) return { color: "var(--color-accent-silver)", fontWeight: 900 };
  if (place === 3) return { color: "var(--color-accent-warm)", fontWeight: 900 };
  return { color: "var(--color-race-fg)" };
}

export const Route = createFileRoute("/reyting/tarix")({
  head: () => ({
    meta: [
      { title: "Oy-oy tarix — 12 oylik jadval | MICCO" },
      {
        name: "description",
        content: "Yil davomida har oy kim qaysi o'rinda bo'lganini bitta jadvalda solishtiring.",
      },
    ],
  }),
  component: YearHistoryTable,
});

function YearHistoryTable() {
  const [rol, setRol] = usePersistentState<Rol>("micco-reyting-tarix-rol", "ishchi");
  const [league, setLeague] = usePersistentState<LeagueKey>("micco-reyting-tarix-league", "diamond");
  const [yil, setYil] = usePersistentState("micco-reyting-tarix-yil", 2026);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["reyting", "tarix", rol, rol === "ishchi" ? league : null, yil],
    queryFn: () => (rol === "ishchi" ? fetchIshchiMatrix(yil, league) : fetchRahbarMatrix(yil, rol)),
  });

  const sortedRows = useMemo(() => {
    function avgPlace(r: PersonRow): number {
      const known = r.months.filter((p): p is number => p !== null);
      return known.length ? known.reduce((s, p) => s + p, 0) / known.length : Number.MAX_SAFE_INTEGER;
    }
    return [...rows].sort((a, b) => avgPlace(a) - avgPlace(b));
  }, [rows]);

  return (
    <PublicShell>
      <div className="overflow-hidden rounded-2xl border border-white/15 bg-white/[0.02]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight lg:text-3xl">12 OYLIK TARIX</h1>
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-race-muted">
              Har oy uchun o'rinlar — bitta jadvalda
            </p>
          </div>
          <div className="w-24 overflow-hidden rounded-xl border border-white/15 bg-white/5 transition-colors focus-within:border-brand">
            <input
              type="number"
              value={yil}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setYil(Number(e.target.value) || yil)}
              className="block w-full max-w-full border-0 bg-transparent px-3 py-2 text-sm text-race-fg outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 border-b border-white/10 px-5 py-4">
          <div className="flex rounded-xl border border-white/15 bg-white/5 p-1">
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRol(r.key)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300"
                style={
                  rol === r.key
                    ? {
                        background: "linear-gradient(90deg, var(--color-accent-cyan), var(--color-brand))",
                        color: "white",
                        boxShadow: "0 0 16px -4px var(--color-brand)",
                      }
                    : { color: "var(--color-race-muted)" }
                }
              >
                <r.icon className="h-3.5 w-3.5 shrink-0" />
                {r.label}
              </button>
            ))}
          </div>

          {rol === "ishchi" ? (
            <div className="scrollbar-none flex max-w-full flex-wrap gap-2 overflow-x-auto">
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
          ) : null}
        </div>

        <div className="overflow-x-auto px-4 py-6 lg:px-8">
          {isLoading ? (
            <p className="py-16 text-center text-sm text-race-muted">Yuklanmoqda...</p>
          ) : sortedRows.length ? (
            <table className="w-full min-w-[900px] border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-race-muted">
                  <th className="w-10 py-2 text-left font-bold">№</th>
                  <th className="min-w-[180px] py-2 text-left font-bold">Ism</th>
                  {MONTHS.map((m) => (
                    <th key={m} className="w-14 py-2 text-center font-bold">
                      {m.slice(0, 3).toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r, i) => (
                  <tr key={r.id} className={cn("border-b border-white/5", i % 2 === 1 && "bg-white/[0.02]")}>
                    <td className="py-2 text-center font-black tabular-nums text-race-muted">{i + 1}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <img src={r.avatar} alt={r.fullName} className="h-7 w-7 shrink-0 rounded-full object-cover" />
                        <span className="truncate text-[11px] font-bold uppercase tracking-wide">{r.fullName}</span>
                      </div>
                    </td>
                    {r.months.map((p, mi) => (
                      <td key={mi} className="py-2 text-center font-bold tabular-nums" style={placeCellStyle(p)}>
                        {p ?? "–"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-16 text-center text-sm text-race-muted">Bu tanlov uchun ma'lumot yo'q.</p>
          )}
        </div>
      </div>
    </PublicShell>
  );
}
