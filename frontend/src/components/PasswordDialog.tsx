import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { KeyRound, Loader2, X } from "lucide-react";

type PasswordDialogProps = {
  title: string;
  description?: string;
  requireOldPassword?: boolean;
  submitting?: boolean;
  onSubmit: (values: { oldPassword?: string; newPassword: string }) => void;
  onClose: () => void;
};

/** Parol o'zgartirish/yangilash uchun umumiy modal — o'zining parolini almashtirish
 * (eskisini bilib) va admin/menejerning quyi rol parolini yangilashi (eskisisiz)
 * uchun bir xil komponent ishlatiladi. */
export function PasswordDialog({
  title,
  description,
  requireOldPassword = false,
  submitting = false,
  onSubmit,
  onClose,
}: PasswordDialogProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Parollar mos kelmadi");
      return;
    }
    setError(null);
    onSubmit(requireOldPassword ? { oldPassword, newPassword } : { newPassword });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        className="card-surface w-full max-w-sm space-y-4 p-5"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
          </div>
          <button type="button" className="btn-ghost px-2 py-1.5" onClick={onClose} aria-label="Yopish">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {requireOldPassword ? (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Joriy parol</label>
            <input
              className="field"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Yangi parol</label>
          <input
            className="field"
            type="password"
            placeholder="Kamida 6 belgi"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Yangi parol (tasdiqlash)</label>
          <input
            className="field"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        {error ? <p className="text-xs text-destructive">{error}</p> : null}

        <button className="btn-brand w-full" type="submit" disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Saqlash
        </button>
      </form>
    </div>,
    document.body,
  );
}
