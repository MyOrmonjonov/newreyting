import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, UserPlus, UserCog } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Reveal, TimeFilter, type Period } from "@/components/motion";
import { OPERATORS } from "@/lib/micco-data";

export const Route = createFileRoute("/operatorlar")({
  head: () => ({
    meta: [
      { title: "Operatorlar — login yaratish | MICCO" },
      {
        name: "description",
        content: "Operator qo'shish: ismi, familiyasi va login-parol yaratish oqimi.",
      },
      { property: "og:title", content: "MICCO operatorlar" },
      { property: "og:description", content: "Operatorlar ro'yxati va yangi operator qo'shish oqimi." },
    ],
  }),
  component: OperatorlarPage,
});

function OperatorlarPage() {
  const [period, setPeriod] = useState<Period>("oy");
  const [date, setDate] = useState("2026-07-28");
  const [ism, setIsm] = useState("");
  const [familiya, setFamiliya] = useState("");

  return (
    <AppShell>
      <PageHeader
        title="Operatorlar"
        subtitle="Operator qo'shish · login-parol yaratish oqimi"
        right={<TimeFilter value={period} onChange={setPeriod} date={date} onDate={setDate} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2 block">
          <div className="card-surface overflow-hidden">
            <div className="border-b border-border p-5">
              <h2 className="text-lg font-semibold">Operatorlar ro'yxati</h2>
              <p className="text-sm text-muted-foreground">Admin tomonidan qo'shiladi va boshqariladi</p>
            </div>
            <ul className="divide-y divide-border">
              {OPERATORS.map((n, i) => (
                <li
                  key={n}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-accent/70"
                  style={{ animation: `micco-rise 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms both` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand">
                      <UserCog className="h-4 w-4" />
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
              toast.success(`Yangi operator "${ism} ${familiya}" yaratildi va login berildi (demo)`);
              setIsm("");
              setFamiliya("");
            }}
          >
            <h2 className="text-lg font-semibold">Operator qo'shish</h2>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Ismi</label>
              <input
                className="field"
                placeholder="Ism"
                value={ism}
                onChange={(e) => setIsm(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Familiyasi</label>
              <input
                className="field"
                placeholder="Familiya"
                value={familiya}
                onChange={(e) => setFamiliya(e.target.value)}
                required
              />
            </div>
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
          </form>
        </Reveal>
      </div>
    </AppShell>
  );
}
