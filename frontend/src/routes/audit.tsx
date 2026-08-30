import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Reveal } from "@/components/motion";
import { api } from "@/lib/api";

type AuditEntryRow = {
  id: number;
  vaqt: string;
  actorFullName: string;
  role: string;
  harakat: string;
  maqsad: string;
};

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [
      { title: "Audit log — kim, qachon, nima qildi | MICCO" },
      {
        name: "description",
        content:
          "Admin uchun to'liq audit jurnali: barcha foydalanuvchilar amallari rol, amal turi va qidiruv bo'yicha filtrlanadi.",
      },
      { property: "og:title", content: "MICCO audit log" },
      { property: "og:description", content: "Har bir qo'shish, o'zgartirish va o'chirish amali qayd etiladi." },
    ],
  }),
  component: AuditPage,
});

function formatVaqt(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const ROLES = ["Barchasi", "Admin", "Operator", "Menejer", "Supervayzer"];
const ACTIONS = ["Barchasi", "qo'shdi", "o'zgartirdi", "o'chirdi", "kirdi"];

function AuditPage() {
  const [role, setRole] = useState("Barchasi");
  const [action, setAction] = useState("Barchasi");
  const [q, setQ] = useState("");

  const { data: audit = [], isLoading } = useQuery({
    queryKey: ["audit"],
    queryFn: () => api.get<AuditEntryRow[]>("/api/audit"),
  });

  const rows = useMemo(
    () =>
      audit.filter(
        (e) =>
          (role === "Barchasi" || e.role === role) &&
          (action === "Barchasi" || e.harakat === action) &&
          (q === "" || (e.actorFullName + e.maqsad).toLowerCase().includes(q.toLowerCase())),
      ),
    [audit, role, action, q],
  );

  const tone: Record<string, string> = {
    "qo'shdi": "bg-success/12 text-success",
    "o'zgartirdi": "bg-warning/15 text-warning",
    "o'chirdi": "bg-destructive/12 text-destructive",
    kirdi: "bg-brand-soft text-brand",
  };

  return (
    <AppShell>
      <PageHeader title="Audit log" subtitle="Admin uchun · barcha foydalanuvchilarning barcha amallari" />

      <Reveal>
        <div className="card-surface mb-5 flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="field pl-9"
              placeholder="Ism yoki obyekt bo'yicha qidirish"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select className="field w-auto" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select className="field w-auto" value={action} onChange={(e) => setAction(e.target.value)}>
            {ACTIONS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <div className="card-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Vaqt</th>
                <th className="px-5 py-3 font-medium">Kim</th>
                <th className="px-5 py-3 font-medium">Rol</th>
                <th className="px-5 py-3 font-medium">Amal</th>
                <th className="px-5 py-3 font-medium">Obyekt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e, i) => (
                <tr
                  key={e.id}
                  className="border-b border-border/70 transition-colors last:border-0 hover:bg-accent/70"
                  style={{ animation: `micco-rise 0.45s cubic-bezier(0.16,1,0.3,1) ${i * 40}ms both` }}
                >
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">{formatVaqt(e.vaqt)}</td>
                  <td className="px-5 py-3 font-medium">{e.actorFullName}</td>
                  <td className="px-5 py-3 text-muted-foreground">{e.role}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone[e.harakat]}`}>
                      {e.harakat}
                    </span>
                  </td>
                  <td className="px-5 py-3">{e.maqsad}</td>
                </tr>
              ))}
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                    Filtrga mos yozuv topilmadi
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Reveal>
    </AppShell>
  );
}
