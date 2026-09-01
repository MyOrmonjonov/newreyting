import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Scale, Trophy, Users, ArrowUpDown, Gift, Award } from "lucide-react";
import { PublicShell } from "@/components/PublicShell";
import { Reveal } from "@/components/motion";
import { LEAGUES, AGENT_LEAGUE_POINTS, type LeagueKey } from "@/lib/micco-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/nizom")({
  head: () => ({
    meta: [
      { title: "Musobaqa nizomi — MICCO Sales League va Supervisor League | MICCO" },
      {
        name: "description",
        content:
          "MICCO Sales League (agentlar) va MICCO Supervisor League musobaqa nizomi — ligalar, ball berish tizimi, liga almashish va taqdirlash qoidalari.",
      },
      { property: "og:title", content: "MICCO musobaqa nizomi" },
      { property: "og:description", content: "Qanday taqdirlanasiz? Ballar, ligalar va qoidalar shu yerda." },
    ],
  }),
  component: NizomPage,
});

type Doc = "agent" | "supervayzer";

const AGENT_LEAGUE_KEYS: { key: LeagueKey; label: string }[] = [
  { key: "diamond", label: "Diamond" },
  { key: "gold", label: "Gold" },
  { key: "silver", label: "Silver" },
  { key: "bronze", label: "Bronze" },
  { key: "rising", label: "Rising" },
];

const AGENT_LEAGUE_TABLE = AGENT_LEAGUE_KEYS.map(({ key, label }) => {
  const { p1, p2, p3, floor } = AGENT_LEAGUE_POINTS[key];
  return { key, label, row: [p1, p2, p3, p3 - 1, p3 - 2, p3 - 3], floor };
});

const SUPERVISOR_POINTS = [24, 22, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

const NOMINATIONS = [
  { league: "Diamond", emoji: "💎", title: "Diamond Champion" },
  { league: "Gold", emoji: "👑", title: "Sales King" },
  { league: "Silver", emoji: "🚀", title: "Fast Promotion" },
  { league: "Bronze", emoji: "🏆", title: "Bronze Champion" },
  { league: "Rising", emoji: "⭐", title: "Rising Star" },
];

type Section = { title: string; body: string[] };

const AGENT_SECTIONS: Section[] = [
  {
    title: "Ishtirokchilar",
    body: [
      "Musobaqa boshlanishidan oldin barcha agentlar avvalgi faoliyati natijalariga asosan tegishli ligalarga taqsimlanadi. Har bir agent bir vaqtning o'zida faqat bitta ligada ishtirok etadi.",
      "Musobaqa boshlangandan keyin ishga qabul qilingan yangi agentlar Rising ligadan ishtirok etishni boshlaydi.",
      "Ishdan bo'shagan agentning ishtiroki avtomatik yakunlanadi — to'plagan ballari boshqa agentga o'tkazilmaydi.",
      "Agent boshqa hudud yoki supervayzer tasarrufiga o'tkazilganda, to'plagan ballari va ligadagi maqomi saqlanib qoladi.",
      "Keyingi mavsum boshida agent avvalgi mavsumni qaysi liga va o'rinda yakunlagan bo'lsa, o'sha liga va o'rindan boshlaydi.",
    ],
  },
  {
    title: "Musobaqa davri",
    body: [
      "MICCO Sales League har yili 12 oylik mavsum asosida o'tkaziladi — 1-yanvardan 31-dekabrgacha.",
      "Reyting har oyning yakunida tasdiqlangan KPI natijalari asosida shakllantiriladi va navbatdagi oy boshida e'lon qilinadi.",
      "Mavsum yakunida barcha oylik ballar jamlanadi va yillik g'oliblar aniqlanadi.",
    ],
  },
  {
    title: "Agent ishdan ketganda",
    body: [
      "Agent ishdan bo'shatilgan yoki o'z xohishi bilan ketgan kundan boshlab uning ishtiroki yakunlangan hisoblanadi — to'plagan ballari boshqa agentga o'tkazilmaydi.",
      "Bo'shagan o'ringa qabul qilingan yangi agent Rising ligadan va 0 ball bilan boshlaydi.",
      "Agar agent oy yakuniga qadar ishdan bo'shasa, u mazkur oy reytingida ishtirok etmaydi va ball olmaydi.",
      "Agar natijalar tasdiqlangandan keyin ishdan bo'shasa, o'sha oy uchun olgan ballari saqlanadi.",
    ],
  },
  {
    title: "Agent boshqa hududga o'tganda",
    body: [
      "Ishtiroki davom etadi, to'plagan ballari saqlanib qoladi va yangi hududda ham umumiy reytingga qo'shib boriladi.",
      "Agent qaysi ligada ishtirok etayotgan bo'lsa, o'sha ligadagi ishtirokini davom ettiradi — liga faqat oylik reyting natijalariga ko'ra o'zgaradi.",
      "Bu o'tish yillik reytingdagi ballari, maqomi yoki mukofotlar uchun ishtirok etish huquqiga ta'sir qilmaydi.",
    ],
  },
  {
    title: "Teng ball (yakuniy reyting)",
    body: [
      "Mavsum davomida ko'proq 1-o'rinni egallagan agent ustun hisoblanadi.",
      "Agar u ham teng bo'lsa — ko'proq 2-o'rin, so'ng ko'proq 3-o'rin.",
      "Baribir teng bo'lsa — mavsum davomidagi o'rtacha reja bajarish foizi yuqori bo'lgan agent ustun hisoblanadi.",
      "Barchasi teng bo'lsa, yakuniy qarorni Tashkilotchi qabul qiladi.",
    ],
  },
  {
    title: "Diskvalifikatsiya",
    body: [
      "Soxta/noto'g'ri ma'lumot taqdim etish, KPI natijalarini manipulyatsiya qilish yoki kompaniya tartib-qoidalarini qo'pol buzish — diskvalifikatsiyaga sabab bo'lishi mumkin.",
      "Diskvalifikatsiya qilingan ishtirokchi joriy oy uchun ball olmaydi, egallagan o'rni bekor qilinadi va mukofot huquqidan mahrum etiladi.",
      "Qaror faqat dalillar asosida, ishtirokchiga tushuntirish berish imkoniyati yaratilgandan keyin qabul qilinadi.",
    ],
  },
  {
    title: "Apellyatsiya",
    body: [
      "Reyting yoki ball hisoblashda xatolik deb hisoblasa, agent reyting e'lon qilingandan 3 ish kuni ichida yozma apellyatsiya berishi mumkin.",
      "Tashkiliy qo'mita 5 ish kuni ichida ko'rib chiqadi va javob beradi. Texnik xato aniqlansa, reyting tuzatiladi.",
      "Faqat: reja bajarish foizini hisoblashdagi xatolik, ballarni noto'g'ri hisoblash, ligaga noto'g'ri joylashtirish bo'yicha qabul qilinadi — subyektiv e'tirozlar (masalan \"men ko'proq harakat qildim\") asos bo'lmaydi.",
    ],
  },
];

const SUPERVISOR_SECTIONS: Section[] = [
  {
    title: "Ishtirokchilar",
    body: [
      "Kompaniyaning barcha amaldagi supervayzerlari ishtirok etadi.",
      "Supervayzer almashganda ballar yangi xodimga o'tkazilmaydi — yangi supervayzer 0 balldan boshlaydi.",
      "\"Supervisor of the Year | Elite Supervisor\" nominatsiyasida qatnashish va sovrin olish uchun supervayzer amalda kompaniyada ishlayotgan bo'lishi shart.",
    ],
  },
  {
    title: "Yillik nominatsiya",
    body: ["Yil davomida eng ko'p ball to'plagan supervayzer \"Supervisor of the Year | Elite Supervisor\" unvoniga sazovor bo'ladi."],
  },
  {
    title: "Teng ball",
    body: [
      "Ustunlik tartibi: yil davomida ko'proq 1-o'rin, so'ng ko'proq 2-o'rin, so'ng ko'proq 3-o'rin, so'ng yillik KPI bajarilish foizi yuqoriligi.",
    ],
  },
  {
    title: "Diskvalifikatsiya",
    body: ["Soxta hisobot yoki ichki qoidalarni qo'pol buzgan ishtirokchi rahbariyat qarori bilan diskvalifikatsiya qilinishi mumkin."],
  },
  {
    title: "Taqdirlash",
    body: ["Yillik g'olibga Kubok, Elite Supervisor premium merch-uniformasi, bosh sovrin va sertifikat topshiriladi."],
  },
];

function NizomPage() {
  const [doc, setDoc] = useState<Doc>("agent");

  return (
    <PublicShell>
      <div className="mx-auto max-w-4xl">
        <Reveal>
          <div className="mb-6 flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-race-fg">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">Musobaqa nizomi</h1>
              <p className="text-sm text-race-muted">
                Qanday taqdirlanasiz, qanday g'olib bo'lasiz — barcha qoidalar shaffof va ochiq.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={40}>
          <div className="mb-6 inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => setDoc("agent")}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300",
                doc === "agent" ? "bg-brand text-brand-foreground shadow-glow" : "text-race-muted hover:text-race-fg",
              )}
            >
              MICCO Sales League (Agentlar)
            </button>
            <button
              onClick={() => setDoc("supervayzer")}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300",
                doc === "supervayzer" ? "bg-brand text-brand-foreground shadow-glow" : "text-race-muted hover:text-race-fg",
              )}
            >
              MICCO Supervisor League
            </button>
          </div>
        </Reveal>

        {doc === "agent" ? <AgentNizom /> : <SupervisorNizom />}
      </div>
    </PublicShell>
  );
}

function InfoCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-race-muted">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function AccordionSections({ sections }: { sections: Section[] }) {
  return (
    <div className="space-y-2">
      {sections.map((s) => (
        <details key={s.title} className="group rounded-xl border border-white/10 bg-white/5 open:bg-white/[0.07]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold">
            {s.title}
            <span className="text-race-muted transition-transform duration-200 group-open:rotate-180">▾</span>
          </summary>
          <div className="space-y-2 px-4 pb-4 text-sm leading-relaxed text-race-muted">
            {s.body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}

function AgentNizom() {
  return (
    <div className="space-y-6 pb-10">
      <Reveal delay={60}>
        <InfoCard icon={<Trophy className="h-4 w-4" />} title="Maqsad">
          <p className="text-sm leading-relaxed text-race-fg/90">
            Savdo agentlari o'rtasida sog'lom va shaffof raqobat muhitini yaratish, har bir agentga o'z natijalari
            orqali yuqori ligalarga ko'tarilish imkonini berish hamda yil davomida barqaror faoliyat ko'rsatgan
            agentlarni aniqlash va taqdirlash.
          </p>
        </InfoCard>
      </Reveal>

      <Reveal delay={90}>
        <InfoCard icon={<Users className="h-4 w-4" />} title="Liga tizimi">
          <p className="mb-3 text-sm text-race-muted">Har bir liga — 27 nafar agentdan iborat (Rising soni o'zgarib turadi).</p>
          <div className="flex flex-wrap gap-2">
            {LEAGUES.map((l) => (
              <span
                key={l.key}
                className="rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest"
                style={{ backgroundColor: `color-mix(in oklab, ${l.accent} 18%, transparent)`, color: l.accent }}
              >
                {l.name}
              </span>
            ))}
          </div>
        </InfoCard>
      </Reveal>

      <Reveal delay={120}>
        <InfoCard icon={<Award className="h-4 w-4" />} title="Ball berish tizimi">
          <p className="mb-3 text-sm text-race-muted">
            Har oy liga ichidagi o'ringa qarab ball beriladi — har liganing o'z jadvali bor.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-center text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-widest text-race-muted">
                  <th className="px-2 py-2 text-left">Liga</th>
                  <th className="px-2 py-2">1</th>
                  <th className="px-2 py-2">2</th>
                  <th className="px-2 py-2">3</th>
                  <th className="px-2 py-2">4</th>
                  <th className="px-2 py-2">5</th>
                  <th className="px-2 py-2">6</th>
                  <th className="px-2 py-2">... 27</th>
                </tr>
              </thead>
              <tbody>
                {AGENT_LEAGUE_TABLE.map((row) => {
                  const meta = LEAGUES.find((l) => l.key === row.key)!;
                  return (
                    <tr key={row.key} className="border-t border-white/10">
                      <td className="px-2 py-2 text-left font-bold" style={{ color: meta.accent }}>
                        {row.label}
                      </td>
                      {row.row.map((v, i) => (
                        <td key={i} className="px-2 py-2 tabular-nums">
                          {v}
                        </td>
                      ))}
                      <td className="px-2 py-2 tabular-nums text-race-muted">{row.floor}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-race-muted">
            4-o'rindan boshlab har o'ringa −1 ball, jadvaldagi oxirgi qiymatdan pastga tushmaydi.
          </p>
        </InfoCard>
      </Reveal>

      <Reveal delay={150}>
        <InfoCard icon={<ArrowUpDown className="h-4 w-4" />} title="Liga almashish (har oy)">
          <ul className="space-y-1.5 text-sm text-race-fg/90">
            <li>Diamond'da oxirgi 5 o'rin (23–27) → Gold'ga tushadi, Gold'dagi top-5 (1–5) → Diamond'ga ko'tariladi.</li>
            <li>Gold'da oxirgi 5 o'rin → Silver'ga tushadi, Silver'dagi top-5 → Gold'ga ko'tariladi.</li>
            <li>Silver'da oxirgi 5 o'rin → Bronze'ga tushadi, Bronze'dagi top-5 → Silver'ga ko'tariladi.</li>
            <li>Bronze'da oxirgi 5 o'rin → Rising'ga tushadi, Rising'dagi top-5 → Bronze'ga ko'tariladi.</li>
          </ul>
        </InfoCard>
      </Reveal>

      <Reveal delay={180}>
        <InfoCard icon={<Gift className="h-4 w-4" />} title="Oylik mukofot va nominatsiyalar">
          <p className="mb-3 text-sm text-race-fg/90">
            Har bir ligada 1-o'rinni egallagan agent — shu liga g'olibi. Sovg'a: 600 000 so'm pul mukofoti,
            sertifikat, Telegram e'tirofi.
          </p>
          <div className="flex flex-wrap gap-3">
            {NOMINATIONS.map((n) => (
              <span key={n.league} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
                <span className="mr-1.5">{n.emoji}</span>
                <b>{n.league}</b> — {n.title}
              </span>
            ))}
          </div>
        </InfoCard>
      </Reveal>

      <AccordionSections sections={AGENT_SECTIONS} />
    </div>
  );
}

function SupervisorNizom() {
  return (
    <div className="space-y-6 pb-10">
      <Reveal delay={60}>
        <InfoCard icon={<Trophy className="h-4 w-4" />} title="Maqsad">
          <p className="text-sm leading-relaxed text-race-fg/90">
            Supervayzerlar o'rtasida sog'lom raqobatni rivojlantirish, yuqori natijalarni rag'batlantirish va yil
            davomida barqaror ishlashni taqdirlash.
          </p>
        </InfoCard>
      </Reveal>

      <Reveal delay={90}>
        <InfoCard icon={<Award className="h-4 w-4" />} title="Ball berish tizimi (liga yo'q — yagona reyting)">
          <p className="mb-3 text-sm text-race-muted">
            Har oy yakuniy KPI natijalari bo'yicha yagona reyting tuziladi (liga bo'linishi yo'q).
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-center text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-widest text-race-muted">
                  {SUPERVISOR_POINTS.map((_, i) => (
                    <th key={i} className="px-2 py-2">
                      {i + 1}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-white/10">
                  {SUPERVISOR_POINTS.map((v, i) => (
                    <td key={i} className="px-2 py-2 tabular-nums">
                      {v}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-race-muted">
            1-o'rin = 24 ball, 2 = 22, 3 = 20, 4-o'rindan boshlab har o'ringa −1, 23-o'rin va undan past = 0 ball.
          </p>
        </InfoCard>
      </Reveal>

      <Reveal delay={120}>
        <InfoCard icon={<Gift className="h-4 w-4" />} title="Oylik mukofot">
          <p className="text-sm text-race-fg/90">
            Har oy TOP-3 supervayzer sovrin bilan taqdirlanadi. Sovrin turi va miqdori har mavsum yoki har oy
            boshida e'lon qilinadi.
          </p>
        </InfoCard>
      </Reveal>

      <AccordionSections sections={SUPERVISOR_SECTIONS} />
    </div>
  );
}
