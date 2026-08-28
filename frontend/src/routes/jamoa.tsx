import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, ShieldCheck, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Reveal, TimeFilter, type Period } from "@/components/motion";
import { MANAGERS, SUPERVISORS } from "@/lib/micco-data";

export const Route = createFileRoute("/jamoa")({
  head: () => ({
    meta: [
      { title: "Menejer va supervayzer qo'shish — login yaratish | MICCO" },
      {
        name: "description",
        content:
          "Operator menejer, menejer esa supervayzer qo'shadi: login-parol yaratish oqimi va huquqlar boshqaruvi.",
      },
      { property: "og:title", content: "MICCO jamoa boshqaruvi" },
      { property: "og:description", content: "Rollar ierarxiyasi bo'yicha akkaunt yaratish oqimi." },
    ],
  }),
  component: TeamPage,
});

type Tab = "menejer" | "supervayzer";

function TeamPage() {
  const [tab, setTab] = useState<Tab>("menejer");
  const [period, setPeriod] = useState<Period>("oy");
  const [date, setDate] = useState("2026-07-28");
  const list = tab === "menejer" ? MANAGERS : SUPERVISORS;

  return (
    <AppShell>
      <PageHeader
        title="Menejer / Supervayzer qo'shish"
        subtitle="Login-parol yaratish oqimi bilan · rol ierarxiyasi hurmat qilinadi"
        right={<TimeFilter value={period} onChange={setPeriod} date={date} onDate={setDate} />}
      />

      <div className="mb-6 inline-flex rounded-xl border border-border bg-card p-1">
        {(["menejer", "supervayzer"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all duration-300 ${
              tab === t ? "bg-brand text-brand-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}lar
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2 block" key={tab}>
          <div className="card-surface overflow-hidden">
            <div className="border-b border-border p-5">
              <h2 className="text-lg font-semibold capitalize">{tab}lar ro'yxati</h2>
              <p className="text-sm text-muted-foreground">
                {tab === "menejer"
                  ? "Operator tomonidan qo'shiladi va boshqariladi"
                  : "Menejer tomonidan qo'shiladi va boshqariladi"}
              </p>
            </div>
            <ul className="divide-y divide-border">
              {list.map((n, i) => (
                <li
                  key={n}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-accent/70"
                  style={{ animation: `micco-rise 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms both` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand">
                      <ShieldCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{n}</p>
                      <p className="text-xs text-muted-foreground">
                        login: {n.split(" ").pop()?.toLowerCase()}@micco
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-ghost" onClick={() => toast.success("Yangi parol yuborildi (demo)")}>
                      <KeyRound className="h-3.5 w-3.5" /> Parolni yangilash
                    </button>
                    <button className="btn-ghost" onClick={() => toast("Panelga kirildi (demo)")}>
                      Panelga kirish
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={90} className="block">
          <form
            className="card-surface space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success(`Yangi ${tab} yaratildi va login berildi (demo)`);
            }}
          >
            <h2 className="text-lg font-semibold capitalize">Yangi {tab}</h2>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Ism familiya</label>
              <input className="field" placeholder="Ism familiya" required />
            </div>
            {tab === "supervayzer" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Biriktiriladigan menejer</label>
                <select className="field">
                  {MANAGERS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Login</label>
              <input className="field" placeholder="login@micco" required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Parol</label>
              <input className="field" type="password" placeholder="········" required />
            </div>
            <button className="btn-brand w-full" type="submit">
              <UserPlus className="h-4 w-4" /> Yaratish va login berish
            </button>
            <p className="text-[11px] text-muted-foreground">
              Eslatma: ishchi (agent) uchun login yaratilmaydi — u faqat ochiq reyting sahifasini ko'radi.
            </p>
          </form>
        </Reveal>
      </div>
    </AppShell>
  );
}
