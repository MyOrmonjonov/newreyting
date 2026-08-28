import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { UploadCloud, Loader2, ImageOff } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { cutoutPersonFromImage, warmUpSegmenter, type CutoutResult } from "@/lib/bg-removal";

export const Route = createFileRoute("/fon-test")({
  head: () => ({
    meta: [{ title: "Fon ochirish — sinov | MICCO" }],
  }),
  component: BackgroundRemovalTest,
});

function BackgroundRemovalTest() {
  const [original, setOriginal] = useState<string | null>(null);
  const [result, setResult] = useState<CutoutResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStatus("loading");
    setErrorMsg("");
    setResult(null);

    const url = URL.createObjectURL(file);
    setOriginal(url);

    try {
      const image = new Image();
      image.src = url;
      await image.decode();

      const cutout = await cutoutPersonFromImage(image);
      setResult(cutout);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Kutilmagan xatolik yuz berdi.");
      setStatus("error");
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="Fon ochirish — sinov sahifasi"
        subtitle="Haqiqiy rasm yuklang — odam avtomatik fondan ajratib olinadi va poyga kartada qanday ko'rinishini ko'rasiz. Bu sinov uchun — asosiy menyuda ko'rinmaydi."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">1. Rasm yuklang</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <button
            type="button"
            className="btn-brand w-full"
            onClick={() => {
              warmUpSegmenter();
              fileInputRef.current?.click();
            }}
          >
            <UploadCloud className="h-4 w-4" />
            Rasm tanlash
          </button>

          {original ? (
            <div className="mt-5">
              <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">Asl rasm</p>
              <img src={original} alt="Asl rasm" className="max-h-72 w-full rounded-lg object-contain" />
            </div>
          ) : null}

          {status === "loading" ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Model yuklanmoqda va rasm qayta ishlanmoqda (birinchi marta biroz vaqt olishi mumkin)...
            </div>
          ) : null}

          {status === "error" ? (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
              <ImageOff className="mt-0.5 h-4 w-4 shrink-0" />
              {errorMsg}
            </div>
          ) : null}
        </div>

        <div className="card-surface p-6">
          <h2 className="mb-4 text-lg font-semibold">2. Poyga kartada ko'rinishi</h2>
          <div
            className="relative flex h-80 items-center justify-center overflow-hidden rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, var(--race-red) 0%, var(--race-red) 55%, color-mix(in oklab, var(--race-red-deep) 90%, black) 100%)",
            }}
          >
            {result ? (
              <img
                src={result.dataUrl}
                alt="Fondan ajratilgan"
                className="max-h-[92%] max-w-[92%] object-contain"
                style={{ filter: "drop-shadow(0 14px 26px oklch(0 0 0 / 0.5))" }}
              />
            ) : (
              <p className="px-6 text-center text-sm text-white/70">
                Rasm yuklangach, natija shu yerda — qizil "poyga" foni ustida — ko'rinadi.
              </p>
            )}
          </div>
          {result ? (
            <p className="mt-3 text-xs text-muted-foreground">
              O'lcham: {result.width}×{result.height}px · orqa fon shaffof (PNG)
            </p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
