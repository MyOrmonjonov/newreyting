// Backenddagi RatingService javoblariga mos tiplar va yordamchi funksiyalar.
// micco-data.ts'dagi demo generatorlar (buildLeague/buildManagers/...) o'rniga
// endi shu tiplar orqali /api/reyting/* dan haqiqiy ma'lumot olinadi.

export type AgentApiRow = {
  id: number;
  place: number;
  ism: string;
  familiya: string;
  fullName: string;
  supervisorFullName: string;
  percent: number;
  points: number;
  today: number;
  yesterday: number;
  trophies: number;
  yearsActive: number;
  league: "diamond" | "gold" | "silver" | "bronze" | "rising";
  rasm: string | null;
};

export type RankedApiRow = {
  id: number;
  place: number;
  fullName: string;
  percent: number;
  yesterday: number;
  monthPoints: number;
};

export type ScoreboardApiRow = {
  id: number;
  place: number;
  fullName: string;
  oylar: { oy: string; percent: number; ball: number }[];
  ortachaPercent: number;
  jamiBall: number;
};

const STRIPES = [
  "#E10600",
  "#00D2BE",
  "#0090FF",
  "#FF8700",
  "#B6BABD",
  "#DC0000",
  "#2293D1",
  "#F596C8",
  "#6CD3BF",
  "#C8102E",
];

export function stripeFor(id: number): string {
  return STRIPES[id % STRIPES.length]!;
}

/** Surat yuklanmagan xodimlar uchun — ism-familiya bosh harflari, rangli doira ichida. */
export function avatarFor(seed: string): string {
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&fontWeight=700`;
}

/** `<input type=date>` qiymatidan ("2026-07-28") oy so'rov parametrini ("2026-07-01") chiqaradi. */
export function monthParam(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}
