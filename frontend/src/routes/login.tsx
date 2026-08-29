import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Kirish | MICCO" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      void navigate({ to: "/" });
    }
  }, [loading, user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(form.login.trim(), form.password);
      void navigate({ to: "/" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kirishda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center bg-race-bg px-4 text-race-fg">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-brand text-lg font-bold text-brand-foreground">
            M
          </div>
          <div>
            <p className="text-lg font-bold tracking-wide">MICCO</p>
            <p className="text-xs uppercase tracking-[0.2em] text-race-muted">Boshqaruv paneliga kirish</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-white/10 bg-race-panel p-6 shadow-lift"
        >
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-race-muted">Login</label>
            <input
              className="field"
              value={form.login}
              onChange={(e) => setForm((s) => ({ ...s, login: e.target.value }))}
              autoFocus
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-race-muted">Parol</label>
            <input
              className="field"
              type="password"
              value={form.password}
              onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
              required
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">{error}</p>
          ) : null}

          <button type="submit" className="btn-brand w-full" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Kirish
          </button>
        </form>
      </div>
    </div>
  );
}
