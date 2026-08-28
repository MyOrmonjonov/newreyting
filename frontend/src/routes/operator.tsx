import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { FileSpreadsheet, ImageOff, Loader2, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Donut, Reveal, TimeFilter, periodFactor, type Period } from "@/components/motion";
import { LEAGUES, PRODUCTS, STAFF, SUPERVISORS, overallPercent } from "@/lib/micco-data";
import { cutoutPersonFromImage, warmUpSegmenter } from "@/lib/bg-removal";

export const Route = createFileRoute("/operator")({
  head: () => ({
    meta: [
      { title: "Operator paneli — ishchilarni tizimga kiritish | MICCO" },
      {
        name: "description",
        content:
          "Ishchilarni qo'shish, supervayzer biriktirish, mahsulot bo'yicha oylik plan belgilash va Excel'dan import qilish.",
      },
      { property: "og:title", content: "MICCO Operator paneli" },
      { property: "og:description", content: "Xodimlar jadvali va yangi ishchi qo'shish oqimi." },
    ],
  }),
  component: OperatorPage,
});

function OperatorPage() {
  const [period, setPeriod] = useState<Period>("oy");
  const [date, setDate] = useState("2026-07-28");
  const f = periodFactor(period, date);
  const [plans, setPlans] = useState<Record<string, { plan: number; done: number }>>(
    Object.fromEntries(PRODUCTS.map((p) => [p.id, { plan: p.defaultPlan, done: 0 }])),
  );

  const preview = useMemo(() => overallPercent(Object.values(plans)), [plans]);
  const staff = useMemo(
    () => STAFF.map((s) => ({ ...s, percent: Math.round(s.percent * f * 10) / 10 })),
    [f],
  );

  const [photo, setPhoto] = useState<string | null>(null);
  const [photoStatus, setPhotoStatus] = useState<"idle" | "loading" | "error">("idle");
  const photoInputRef = useRef<HTMLInputElement>(null);

  async function handlePhotoFile(file: File) {
    setPhotoStatus("loading");
    try {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.src = url;
      await image.decode();
      const cutout = await cutoutPersonFromImage(image);
      setPhoto(cutout.dataUrl);
      setPhotoStatus("idle");
      URL.revokeObjectURL(url);
    } catch (err) {
      setPhotoStatus("error");
      toast.error(err instanceof Error ? err.message : "Suratni qayta ishlab bo'lmadi.");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Ishchilarni tizimga kiritish"
        subtitle="Operator paneli · xodimlar bazasi va oylik planlar"
        right={<TimeFilter value={period} onChange={setPeriod} date={date} onDate={setDate} />}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Reveal className="xl:col-span-2 block">
          <div className="card-surface overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
              <div>
                <h2 className="text-lg font-semibold">Mavjud xodimlar</h2>
                <p className="text-sm text-muted-foreground">{staff.length} ta faol ishchi</p>
              </div>
              <button className="btn-ghost" onClick={() => toast.success("Excel import oynasi ochildi (demo)")}>
                <FileSpreadsheet className="h-4 w-4" /> Excel'dan import
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-medium">Ism</th>
                    <th className="px-5 py-3 font-medium">Supervayzer</th>
                    <th className="px-5 py-3 font-medium">Liga</th>
                    <th className="px-5 py-3 font-medium">Joriy foiz</th>
                    <th className="px-5 py-3 text-right font-medium">Amallar</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((s, i) => (
                    <tr
                      key={s.id}
                      className="border-b border-border/70 transition-colors duration-200 last:border-0 hover:bg-accent/70"
                      style={{ animation: `micco-rise 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 45}ms both` }}
                    >
                      <td className="px-5 py-3 font-medium">{s.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{s.supervisor}</td>
                      <td className="px-5 py-3">
                        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs">{s.league}</span>
                      </td>
                      <td className="px-5 py-3 font-semibold tabular-nums">{s.percent}%</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button className="btn-ghost px-2 py-1" onClick={() => toast("Tahrirlash (demo)")}>
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="btn-ghost px-2 py-1 text-destructive"
                            onClick={() => toast.error("O'chirish tasdiqlanadi (demo)")}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100} className="block">
          <form
            className="card-surface space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Yangi ishchi qo'shildi (demo)");
              setPhoto(null);
              setPhotoStatus("idle");
            }}
          >
            <h2 className="text-lg font-semibold">Yangi ishchi qo'shish</h2>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Surat</label>
              <div className="flex items-center gap-4">
                <div
                  className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-muted"
                  style={
                    photo
                      ? { background: "linear-gradient(140deg, var(--race-red), var(--race-red-deep))" }
                      : undefined
                  }
                >
                  {photoStatus === "loading" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : photo ? (
                    <img src={photo} alt="Ishchi surati" className="cutout-avatar h-full w-full" />
                  ) : (
                    <UserRound className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handlePhotoFile(file);
                    }}
                  />
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      warmUpSegmenter();
                      photoInputRef.current?.click();
                    }}
                  >
                    {photo ? "Suratni almashtirish" : "Surat yuklash"}
                  </button>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Fon avtomatik olib tashlanadi va reyting sahifalarida shu ko'rinishda chiqadi.
                  </p>
                  {photoStatus === "error" ? (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-danger">
                      <ImageOff className="h-3 w-3" /> Rasmda odam topilmadi — boshqasini sinab ko'ring.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Ism familiya</label>
              <input className="field" placeholder="Farg'onaSmile STp9 Ahliyor" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Supervayzer</label>
              <select className="field">
                {SUPERVISORS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Boshlang'ich liga</label>
                <select className="field">
                  {LEAGUES.map((l) => (
                    <option key={l.key}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Joriy foiz</label>
                <input className="field" type="number" defaultValue={0} />
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mahsulot bo'yicha oylik plan
              </p>
              <div className="space-y-3">
                {PRODUCTS.map((p) => (
                  <div key={p.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                    <span className="text-sm">
                      {p.name} <span className="text-xs text-muted-foreground">({p.unit})</span>
                    </span>
                    <input
                      className="field w-24"
                      type="number"
                      value={plans[p.id]?.plan ?? 0}
                      onChange={(e) =>
                        setPlans((s) => ({
                          ...s,
                          [p.id]: { plan: Number(e.target.value), done: s[p.id]?.done ?? 0 },
                        }))
                      }
                    />
                    <input
                      className="field w-24"
                      type="number"
                      value={plans[p.id]?.done ?? 0}
                      onChange={(e) =>
                        setPlans((s) => ({
                          ...s,
                          [p.id]: { plan: s[p.id]?.plan ?? 0, done: Number(e.target.value) },
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Chapdagi maydon — plan, o'ngdagi — bajarilgan miqdor.
              </p>
              <div className="mt-4 flex items-center gap-4 rounded-lg bg-muted/60 p-3">
                <Donut value={Math.round(preview * 10) / 10} size={82} stroke={8} />
                <p className="text-xs text-muted-foreground">
                  Umumiy foiz = jami bajarilgan / jami plan × 100. Chegara yo'q — 150%, 200% ham mumkin.
                </p>
              </div>
            </div>

            <button type="submit" className="btn-brand w-full">
              <Plus className="h-4 w-4" /> Ishchini saqlash
            </button>
          </form>
        </Reveal>
      </div>
    </AppShell>
  );
}
