import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Donut, ProgressBar, Reveal, TimeFilter, periodFactor, type Period } from "@/components/motion";
import { PRODUCTS, overallPercent } from "@/lib/micco-data";

export const Route = createFileRoute("/mahsulotlar")({
  head: () => ({
    meta: [
      { title: "Mahsulot boshqaruvi va default planlar | MICCO" },
      {
        name: "description",
        content:
          "Faqat operator va admin uchun: mahsulot qo'shish, default oylik plan shablonini belgilash va og'irlikli foiz hisobi.",
      },
      { property: "og:title", content: "MICCO mahsulot boshqaruvi" },
      { property: "og:description", content: "Choy, mixco, suv va boshqa mahsulotlar bo'yicha plan shablonlari." },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const [period, setPeriod] = useState<Period>("oy");
  const [date, setDate] = useState("2026-07-28");
  const f = periodFactor(period, date);
  const [items, setItems] = useState(
    PRODUCTS.map((p) => ({ ...p, done: Math.round(p.defaultPlan * (0.85 + Math.random() * 0.6)) })),
  );

  const rows = items.map((p) => ({ plan: p.defaultPlan, done: Math.round(p.done * f) }));
  const total = overallPercent(rows);

  return (
    <AppShell>
      <PageHeader
        title="Mahsulot boshqaruvi"
        subtitle="Faqat Operator va Admin uchun · default plan shablonlari"
        right={<TimeFilter value={period} onChange={setPeriod} date={date} onDate={setDate} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((p, i) => {
            const done = Math.round(p.done * f);
            const pct = Math.round((done / p.defaultPlan) * 1000) / 10;
            return (
              <Reveal key={p.id} delay={i * 70}>
                <div className="card-surface card-hover flex flex-wrap items-center gap-5 p-5">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Package className="h-5 w-5" />
                  </div>
                  <div className="min-w-[200px] flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-semibold">{p.name}</p>
                      <p className="text-sm tabular-nums text-muted-foreground">
                        {done.toLocaleString("ru-RU")} / {p.defaultPlan.toLocaleString("ru-RU")} {p.unit}
                      </p>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={pct} tone={pct >= 100 ? "success" : "brand"} />
                    </div>
                  </div>
                  <div className="w-24 text-right text-lg font-semibold tabular-nums">{pct}%</div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="space-y-6">
          <Reveal delay={60}>
            <div className="card-surface flex flex-col items-center gap-3 p-6">
              <Donut value={Math.round(total * 10) / 10} size={148} stroke={12} label="Umumiy" />
              <p className="text-center text-xs text-muted-foreground">
                Og'irlikli hisob: jami bajarilgan / jami plan × 100 (mahsulot foizlarining o'rtachasi emas)
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <form
              className="card-surface space-y-4 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const data = new FormData(form);
                const name = String(data.get("name") || "").trim();
                if (!name) return;
                setItems((s) => [
                  ...s,
                  {
                    id: name.toLowerCase(),
                    name,
                    unit: String(data.get("unit") || "dona"),
                    defaultPlan: Number(data.get("plan") || 100),
                    done: 0,
                  },
                ]);
                form.reset();
                toast.success(`"${name}" mahsuloti qo'shildi`);
              }}
            >
              <h2 className="text-lg font-semibold">Yangi mahsulot</h2>
              <input name="name" className="field" placeholder="Mahsulot nomi" required />
              <div className="grid grid-cols-2 gap-3">
                <input name="unit" className="field" placeholder="O'lchov (dona)" />
                <input name="plan" className="field" type="number" placeholder="Default plan" />
              </div>
              <button className="btn-brand w-full" type="submit">
                <Plus className="h-4 w-4" /> Qo'shish
              </button>
            </form>
          </Reveal>
        </div>
      </div>
    </AppShell>
  );
}
