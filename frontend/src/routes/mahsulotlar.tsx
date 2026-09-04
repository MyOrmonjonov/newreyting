import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/AppShell";
import { Reveal } from "@/components/motion";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/mahsulotlar")({
  head: () => ({
    meta: [
      { title: "Mahsulot boshqaruvi va default planlar | MICCO" },
      {
        name: "description",
        content: "Mahsulot qo'shish, tahrirlash va o'chirish — nomi, o'lchov birligi va standart oylik plan.",
      },
      { property: "og:title", content: "MICCO mahsulot boshqaruvi" },
      { property: "og:description", content: "Choy, mixco, suv va boshqa mahsulotlar bo'yicha plan shablonlari." },
    ],
  }),
  component: ProductsPage,
});

type MahsulotRow = { id: number; nomi: string; birlik: string; standartPlan: number };

const EMPTY_FORM = { nomi: "", birlik: "", standartPlan: 100 };

function ProductsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = user?.role === "ADMIN" || user?.role === "OPERATOR";
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: mahsulotlar = [], isLoading } = useQuery({
    queryKey: ["mahsulotlar"],
    queryFn: () => api.get<MahsulotRow[]>("/api/mahsulotlar"),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["mahsulotlar"] });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post<MahsulotRow>("/api/mahsulotlar", payload),
    onSuccess: (created) => {
      invalidate();
      toast.success(`"${created.nomi}" mahsuloti qo'shildi`);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Mahsulot qo'shib bo'lmadi"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: typeof form }) =>
      api.put<MahsulotRow>(`/api/mahsulotlar/${id}`, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Mahsulot yangilandi");
      setEditingId(null);
      setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Mahsulotni yangilab bo'lmadi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/mahsulotlar/${id}`),
    onSuccess: () => {
      invalidate();
      toast.success("Mahsulot o'chirildi");
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Mahsulotni o'chirib bo'lmadi"),
  });

  function startEdit(m: MahsulotRow) {
    setEditingId(m.id);
    setForm({ nomi: m.nomi, birlik: m.birlik, standartPlan: m.standartPlan });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  return (
    <AppShell>
      <PageHeader title="Mahsulot boshqaruvi" subtitle="Nomi, o'lchov birligi va standart oylik plan" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Reveal className="lg:col-span-2 block">
          <div className="card-surface overflow-hidden">
            <div className="border-b border-border p-5">
              <h2 className="text-lg font-semibold">Mahsulotlar ro'yxati</h2>
              <p className="text-sm text-muted-foreground">{mahsulotlar.length} ta mahsulot</p>
            </div>
            {isLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Yuklanmoqda...</p>
            ) : mahsulotlar.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Hali mahsulot qo'shilmagan.</p>
            ) : (
              <ul className="divide-y divide-border">
                {mahsulotlar.map((m, i) => (
                  <li
                    key={m.id}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-accent/70"
                    style={{ animation: `micco-rise 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms both` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-brand">
                        <Package className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{m.nomi}</p>
                        <p className="text-xs text-muted-foreground">
                          {m.birlik} · standart plan: {m.standartPlan}
                        </p>
                      </div>
                    </div>
                    {canManage ? (
                      <div className="flex gap-2">
                        <button className="btn-ghost" onClick={() => startEdit(m)}>
                          <Pencil className="h-3.5 w-3.5" /> Tahrirlash
                        </button>
                        <button
                          className="btn-ghost text-destructive"
                          onClick={() => deleteMutation.mutate(m.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> O'chirish
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Reveal>

        {canManage ? (
          <Reveal delay={90} className="block">
            <form
              className="card-surface space-y-4 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (editingId) updateMutation.mutate({ id: editingId, payload: form });
                else createMutation.mutate(form);
              }}
            >
              <h2 className="text-lg font-semibold">{editingId ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}</h2>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nomi</label>
                <input
                  className="field"
                  placeholder="Masalan: Choy"
                  value={form.nomi}
                  onChange={(e) => setForm((s) => ({ ...s, nomi: e.target.value }))}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">O'lchov</label>
                  <input
                    className="field"
                    placeholder="quti / dona / litr"
                    value={form.birlik}
                    onChange={(e) => setForm((s) => ({ ...s, birlik: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Standart plan</label>
                  <input
                    className="field"
                    type="number"
                    min={0}
                    value={form.standartPlan}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setForm((s) => ({ ...s, standartPlan: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-brand w-full"
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Plus className="h-4 w-4" /> {editingId ? "Saqlash" : "Qo'shish"}
                </button>
                {editingId ? (
                  <button className="btn-ghost" type="button" onClick={cancelEdit}>
                    Bekor qilish
                  </button>
                ) : null}
              </div>
            </form>
          </Reveal>
        ) : null}
      </div>
    </AppShell>
  );
}
