// MICCO demo ma'lumotlari (statik, prezentatsiya uchun)

export type LeagueKey = "diamond" | "gold" | "silver" | "bronze" | "rising";

export const LEAGUES: {
  key: LeagueKey;
  name: string;
  slogan: string;
  accent: string;
  glow: string;
}[] = [
  {
    key: "diamond",
    name: "DIAMOND",
    slogan: "Chempionlar hech qachon to'xtamaydi",
    accent: "oklch(0.86 0.09 210)",
    glow: "oklch(0.72 0.13 215)",
  },
  {
    key: "gold",
    name: "GOLD",
    slogan: "Yuqoriroqni ko'zlang",
    accent: "oklch(0.83 0.15 85)",
    glow: "oklch(0.7 0.16 78)",
  },
  {
    key: "silver",
    name: "SILVER",
    slogan: "O'sishda davom eting",
    accent: "oklch(0.85 0.01 260)",
    glow: "oklch(0.7 0.02 260)",
  },
  {
    key: "bronze",
    name: "BRONZE",
    slogan: "Orzu sari yo'l",
    accent: "oklch(0.68 0.12 55)",
    glow: "oklch(0.58 0.13 48)",
  },
  {
    key: "rising",
    name: "RISING",
    slogan: "Har bir yo'l birinchi qadamdan boshlanadi",
    accent: "oklch(0.78 0.16 150)",
    glow: "oklch(0.65 0.17 152)",
  },
];

export const PERIOD_LABEL = "2026 IYUL";

/** O'zbekistonning 12 ta viloyati — agent qaysi viloyatda ishlashini belgilash uchun. */
export const VILOYATLAR: { key: string; name: string }[] = [
  { key: "ANDIJON", name: "Andijon" },
  { key: "BUXORO", name: "Buxoro" },
  { key: "FARGONA", name: "Farg'ona" },
  { key: "JIZZAX", name: "Jizzax" },
  { key: "XORAZM", name: "Xorazm" },
  { key: "NAMANGAN", name: "Namangan" },
  { key: "NAVOIY", name: "Navoiy" },
  { key: "QASHQADARYO", name: "Qashqadaryo" },
  { key: "SAMARQAND", name: "Samarqand" },
  { key: "SIRDARYO", name: "Sirdaryo" },
  { key: "SURXONDARYO", name: "Surxondaryo" },
  { key: "TOSHKENT", name: "Toshkent" },
];

/**
 * MICCO Sales League Nizomi IV BOB — har liganing 1/2/3-o'rin ballari va pastki "polkasi"
 * (backenddagi RatingService.pointsForLeague bilan bir xil bo'lishi shart).
 */
export const AGENT_LEAGUE_POINTS: Record<LeagueKey, { p1: number; p2: number; p3: number; floor: number }> = {
  diamond: { p1: 34, p2: 31, p3: 30, floor: 6 },
  gold: { p1: 33, p2: 31, p3: 29, floor: 5 },
  silver: { p1: 32, p2: 30, p3: 28, floor: 4 },
  bronze: { p1: 31, p2: 29, p3: 27, floor: 3 },
  rising: { p1: 29, p2: 27, p3: 25, floor: 2 },
};

const BRANCHES = [
  "Farg'onaSmile STp9",
  "Tash.obl TP2",
  "Andijon STp4",
  "Namangan TP7",
  "Buxoro STp1",
  "Samarqand TP5",
  "Xorazm STp3",
  "Qashqadaryo TP8",
  "Navoiy STp6",
  "Jizzax TP1",
  "Sirdaryo STp2",
  "Surxondaryo TP4",
  "Toshkent STp10",
  "Qoraqalpog'iston TP3",
];

const NAMES = [
  "Ahliyor",
  "Muxriddin",
  "Sardorbek",
  "Javohir",
  "Dilshodbek",
  "Ulug'bek",
  "Shohruh",
  "Aziza",
  "Nilufar",
  "Otabek",
  "Bekzod",
  "Kamola",
  "Jasurbek",
  "Ozodbek",
  "Marjona",
  "Islombek",
  "Xurshid",
  "Diyorbek",
  "Gulnoza",
  "Rustam",
  "Doniyor",
  "Sanjar",
  "Malika",
  "Temurbek",
  "Feruza",
  "Akmal",
  "Zuhra",
];

export const OPERATORS = [
  "Operator Jasur",
  "Operator Madina Yusupova",
  "Operator Sherzod Nazarov",
  "Operator Gulbahor Rashidova",
];

export const SUPERVISORS = [
  "Xorazm Supervisor O'tkir",
  "Farg'ona Supervisor Bahrom",
  "Toshkent Supervisor Nodir",
  "Andijon Supervisor Salim",
  "Buxoro Supervisor Yodgor",
  "Samarqand Supervisor Anvar",
  "Namangan Supervisor Ilhom",
  "Navoiy Supervisor Qodir",
  "Jizzax Supervisor Ravshan",
  "Surxon Supervisor Erkin",
];

export const MANAGERS = [
  "Menejer Alisher Qodirov",
  "Menejer Sanjarbek Yo'ldoshev",
  "Menejer Dilnoza Ismoilova",
  "Menejer Ravshan Toshpo'latov",
  "Menejer Kamron Ergashev",
  "Menejer Nargiza Sultonova",
];

export const PRODUCTS = [
  { id: "choy", name: "Choy", unit: "quti", defaultPlan: 320 },
  { id: "mixco", name: "Mixco", unit: "dona", defaultPlan: 500 },
  { id: "suv", name: "Suv", unit: "litr", defaultPlan: 900 },
];

// Mezon: 1-o'rin = 24, 2 = 22, 3 = 20, 4 = 19, keyin har o'ringa -1 (22-o'rin = 1), 23+ = 0
export function pointsForPlace(place: number): number {
  if (place === 1) return 24;
  if (place === 2) return 22;
  if (place === 3) return 20;
  if (place >= 4 && place <= 22) return 23 - place;
  return 0;
}

/** Umumiy foiz = jami bajarilgan / jami plan * 100 (og'irlikli) */
export function overallPercent(rows: { done: number; plan: number }[]): number {
  const done = rows.reduce((s, r) => s + r.done, 0);
  const plan = rows.reduce((s, r) => s + r.plan, 0);
  return plan === 0 ? 0 : (done / plan) * 100;
}

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

export type Agent = {
  id: string;
  place: number;
  name: string;
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

export function buildLeague(league: LeagueKey, count = 27): Agent[] {
  const base = { diamond: 148, gold: 126, silver: 108, bronze: 94, rising: 82 }[league];
  const rnd = seeded(league.length * 977 + base);
  const rows: Agent[] = [];
  for (let i = 0; i < count; i++) {
    const name = NAMES[(i * 3 + base) % NAMES.length]!;
    const branch = BRANCHES[(i * 5 + base) % BRANCHES.length]!;
    const place = i + 1;
    const percent = Math.max(38, base - i * (2.4 + rnd() * 1.1));
    const yesterday = Math.max(1, Math.min(count, place + Math.round((rnd() - 0.5) * 6)));
    rows.push({
      id: `${league}-${place}`,
      place,
      name,
      fullName: `${branch} ${name}`,
      supervisor: SUPERVISORS[(i + base) % SUPERVISORS.length]!,
      percent: Math.round(percent * 10) / 10,
      points: Math.round(pointsForPlace(place) * 6 + rnd() * 40 + (count - i) * 3),
      today: place,
      yesterday,
      avatar: `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(
        branch + name + place,
      )}&backgroundColor=transparent`,
      stripe: STRIPES[i % STRIPES.length]!,
      trophies: Math.max(0, Math.round((count - place) / 6 + rnd() * 3)),
      yearsActive: 1 + Math.floor(rnd() * 5),
    });
  }
  return rows;
}

export type SupervisorRow = {
  place: number;
  name: string;
  avatar: string;
  percent: number;
  daily: number;
  yesterday: number;
  monthPoints: number;
  totalPoints: number;
  months: { month: string; percent: number; points: number }[];
};

export const MONTHS = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "Iyun",
  "Iyul",
  "Avgust",
  "Sentabr",
  "Oktabr",
  "Noyabr",
  "Dekabr",
];

export function buildSupervisors(): SupervisorRow[] {
  const rnd = seeded(4211);
  return SUPERVISORS.map((name, i) => {
    const place = i + 1;
    const percent = Math.round((132 - i * 5.4 - rnd() * 3) * 10) / 10;
    const months = MONTHS.slice(0, 7).map((m, mi) => {
      const p = Math.round((120 - i * 4 + (rnd() - 0.5) * 26) * 10) / 10;
      const pl = Math.max(1, Math.min(10, place + Math.round((rnd() - 0.5) * 5)));
      return { month: m, percent: p, points: pointsForPlace(pl) + mi * 0 };
    });
    return {
      place,
      name,
      avatar: `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(name)}&backgroundColor=transparent`,
      percent,
      daily: Math.round((rnd() * 18 - 7) * 10) / 10,
      yesterday: Math.max(1, Math.min(10, place + Math.round((rnd() - 0.5) * 4))),
      monthPoints: pointsForPlace(place),
      totalPoints: months.reduce((s, m) => s + m.points, 0),
      months,
    };
  });
}

export function buildManagers() {
  const rnd = seeded(919);
  return MANAGERS.map((name, i) => ({
    place: i + 1,
    name,
    avatar: `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(name)}&backgroundColor=transparent`,
    percent: Math.round((128 - i * 6.2 - rnd() * 4) * 10) / 10,
    yesterday: Math.max(1, Math.min(6, i + 1 + Math.round((rnd() - 0.5) * 4))),
  }));
}

export const YEAR_STATS = MONTHS.map((m, i) => ({
  month: m.slice(0, 3),
  plan: 100,
  fakt: Math.round(78 + Math.sin(i / 1.7) * 18 + i * 2.6),
}));

export type AuditEntry = {
  id: number;
  at: string;
  actor: string;
  role: string;
  action: "qo'shdi" | "o'zgartirdi" | "o'chirdi" | "kirdi";
  target: string;
};

export const AUDIT: AuditEntry[] = [
  { actor: "Operator Jasur", role: "Operator", action: "qo'shdi", target: "Menejer Alisher Qodirov" },
  { actor: "Menejer Alisher", role: "Menejer", action: "qo'shdi", target: "Xorazm Supervisor O'tkir" },
  { actor: "Xorazm Supervisor O'tkir", role: "Supervayzer", action: "qo'shdi", target: "Ishchi Ahliyor" },
  { actor: "Operator Jasur", role: "Operator", action: "qo'shdi", target: "Mahsulot: Suv" },
  { actor: "Admin", role: "Admin", action: "o'zgartirdi", target: "Ishchi Muxriddin — iyul plani" },
  { actor: "Xorazm Supervisor O'tkir", role: "Supervayzer", action: "o'chirdi", target: "Ishchi Rustam" },
  { actor: "Menejer Dilnoza", role: "Menejer", action: "o'zgartirdi", target: "Supervisor Bahrom paroli" },
  { actor: "Operator Jasur", role: "Operator", action: "kirdi", target: "Menejer paneli" },
  { actor: "Admin", role: "Admin", action: "qo'shdi", target: "Operator Jasur" },
  { actor: "Samarqand Supervisor Anvar", role: "Supervayzer", action: "o'zgartirdi", target: "Ishchi Feruza plani" },
  { actor: "Menejer Kamron", role: "Menejer", action: "qo'shdi", target: "Navoiy Supervisor Qodir" },
  { actor: "Admin", role: "Admin", action: "o'chirdi", target: "Mahsulot: Sharbat" },
].map((e, i) => ({
  ...e,
  id: i + 1,
  at: `2026-07-${String(28 - i).padStart(2, "0")} ${String(9 + (i % 9)).padStart(2, "0")}:${String((i * 13) % 60).padStart(2, "0")}`,
})) as AuditEntry[];

export const STAFF = buildLeague("diamond", 12).map((a, i) => ({
  id: a.id,
  name: a.fullName,
  supervisor: a.supervisor,
  league: LEAGUES[i % 5]!.name,
  percent: a.percent,
}));

export type SupervisorScoreRow = {
  place: number;
  name: string;
  months: { month: string; percent: number; points: number }[];
  avgPercent: number;
  totalPoints: number;
};

/**
 * Har oy supervayzerlar umumiy ko'rsatgichi (%) bo'yicha saralanadi va
 * o'rniga qarab mezon (pointsForPlace) asosida ball beriladi. Yakunda
 * o'rtacha foiz va jami ball bo'yicha reyting shakllanadi.
 */
export function buildSupervisorScoreboard(monthCount = 5): SupervisorScoreRow[] {
  const rnd = seeded(7331);
  const months = MONTHS.slice(1, 1 + monthCount);

  const percents = SUPERVISORS.map((_, i) =>
    months.map((_, mi) => Math.max(20, Math.round((70 + rnd() * 70 - i * 1.5 + mi * 1.2) * 10) / 10)),
  );

  const pointsByRow: number[][] = SUPERVISORS.map(() => []);
  months.forEach((_, mi) => {
    const order = percents
      .map((p, idx) => ({ idx, percent: p[mi]! }))
      .sort((a, b) => b.percent - a.percent);
    order.forEach((o, rank) => {
      pointsByRow[o.idx]![mi] = pointsForPlace(rank + 1);
    });
  });

  const rows = SUPERVISORS.map((name, idx) => {
    const monthRows = months.map((m, mi) => ({
      month: m,
      percent: percents[idx]![mi]!,
      points: pointsByRow[idx]![mi]!,
    }));
    const avgPercent = Math.round((monthRows.reduce((s, m) => s + m.percent, 0) / monthRows.length) * 10) / 10;
    const totalPoints = monthRows.reduce((s, m) => s + m.points, 0);
    return { name, months: monthRows, avgPercent, totalPoints };
  });

  rows.sort((a, b) => b.totalPoints - a.totalPoints);
  return rows.map((r, i) => ({ ...r, place: i + 1 }));
}
