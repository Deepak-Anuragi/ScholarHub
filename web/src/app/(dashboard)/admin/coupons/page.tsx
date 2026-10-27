"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import AnimatedContent from "@/components/AnimatedContent";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

type Coupon = {
  _id: string; code: string; discountType: "percent" | "flat"; discountValue: number;
  maxUses: number; usedCount: number; expiresAt: string; isActive: boolean;
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({ code: "", discountType: "flat", discountValue: "", maxUses: "", expiresAt: "" });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<{ coupons: Coupon[] }>("/admin/coupons").then((d) => setCoupons(d.coupons ?? [])).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    setSaving(true);
    try {
      await api.post("/admin/coupons", { code: form.code, discountType: form.discountType, discountValue: Number(form.discountValue), maxUses: Number(form.maxUses), expiresAt: form.expiresAt });
      setShowForm(false);
      setForm({ code: "", discountType: "flat", discountValue: "", maxUses: "", expiresAt: "" });
      load();
    } catch { /**/ } finally { setSaving(false); }
  };

  const handleToggle = async (c: Coupon) => {
    await api.patch(/admin/coupons/, { isActive: !c.isActive });
    setCoupons((prev) => prev.map((x) => x._id === c._id ? { ...x, isActive: !x.isActive } : x));
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try { await api.delete(/admin/coupons/); setCoupons((prev) => prev.filter((c) => c._id !== id)); } catch { /**/ } finally { setDeleting(null); }
  };

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <AnimatedContent distance={20} duration={0.45} threshold={0}>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl text-forest-900 sm:text-3xl">Coupons</h1>
            <p className="mt-1 text-sm text-forest-900/60">Manage promo codes</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2 bg-[#16a34a] text-white hover:bg-[#15803d]">
            <Plus className="size-4" /> Create Coupon
          </Button>
        </div>
      </AnimatedContent>
      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-white" />)}</div>
      ) : coupons.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-white/60 py-16 text-center">
          <p className="text-sm text-forest-900/50">No coupons yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-card border border-line bg-white shadow-soft">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs font-semibold uppercase tracking-wider text-forest-900/50">
                <th className="px-4 py-3">Code</th><th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Uses</th><th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id} className="border-b border-line last:border-0 hover:bg-sage-100/30">
                  <td className="px-4 py-3 font-mono font-bold text-forest-900">{c.code}</td>
                  <td className="px-4 py-3">{c.discountType === "percent" ? ${c.discountValue}% : Rs.}</td>
                  <td className="px-4 py-3 text-forest-900/70">{c.usedCount}/{c.maxUses}</td>
                  <td className="px-4 py-3 text-forest-900/70">{new Date(c.expiresAt).toLocaleDateString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => void handleToggle(c)}
                      className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold transition", c.isActive ? "bg-[#16a34a]/10 text-[#16a34a]" : "bg-red-50 text-red-600")}>
                      {c.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => void handleDelete(c._id)} disabled={deleting === c._id}
                      className="rounded-lg p-1.5 text-forest-900/30 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={showForm} onOpenChange={setShowForm} title="Create Coupon">
        <div className="grid gap-3">
          {([["Coupon Code","code","text","SUMMER25"],["Discount Value","discountValue","number","50"],["Max Uses","maxUses","number","100"],["Expires At","expiresAt","date",""]]) .map(([label,key,type,ph]) => (
            <label key={key} className="grid gap-1.5 text-sm font-semibold text-forest-900">
              {label}
              <input type={type} value={form[key as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={ph} className="h-10 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-[#16a34a]" />
            </label>
          ))}
          <label className="grid gap-1.5 text-sm font-semibold text-forest-900">
            Type
            <select value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
              className="h-10 rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-[#16a34a]">
              <option value="flat">Flat (Rs.)</option>
              <option value="percent">Percentage (%)</option>
            </select>
          </label>
          <Button onClick={() => void handleCreate()} disabled={saving} className="mt-1 w-full bg-[#16a34a] text-white hover:bg-[#15803d]">
            {saving ? "Creating..." : "Create Coupon"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
