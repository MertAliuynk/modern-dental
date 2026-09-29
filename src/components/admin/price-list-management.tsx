"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useConfirm } from "@/components/confirm-dialog";
import { API } from "@/lib/api";

type PriceList = { price_list_id: number; name: string; branch_id: number; is_active: boolean; item_count?: number; created_at: string };
type TreatmentType = { treatment_type_id: number; name: string; category: string; is_per_tooth: boolean; is_jaw_specific: boolean };
type Branch = { branch_id: number; name: string };
type Item = { treatmentTypeId: string; price: string; upperJawPrice: string; lowerJawPrice: string; isPerTooth?: boolean };

const EMPTY = { name: "", branchId: "", isActive: true, items: [] as Item[] };

export function PriceListManagement() {
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PriceList | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const { ask, dialog } = useConfirm();

  const fetchPriceLists = async () => {
    try {
      const d = await (await fetch(`${API}/price-list`)).json();
      if (d.success) setPriceLists(d.data);
    } catch {}
  };

  useEffect(() => {
    fetchPriceLists();
    fetch(`${API}/treatment-type`)
      .then((r) => r.json())
      .then((d) => d.success && setTreatmentTypes(d.data))
      .catch(() => {});
    fetch(`${API}/branch`)
      .then((r) => r.json())
      .then((d) => d.success && setBranches(d.data))
      .catch(() => {});
  }, []);

  const reset = () => {
    setFormData(EMPTY);
    setEditing(null);
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = {
        name: formData.name,
        branchId: parseInt(formData.branchId),
        isActive: formData.isActive,
        items: formData.items.map((i) => ({
          treatmentTypeId: parseInt(i.treatmentTypeId),
          price: parseFloat(i.price) || 0,
          upperJawPrice: parseFloat(i.upperJawPrice) || 0,
          lowerJawPrice: parseFloat(i.lowerJawPrice) || 0,
        })),
      };
      const res = await fetch(editing ? `${API}/price-list/${editing.price_list_id}` : `${API}/price-list`, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      const d = await res.json();
      if (d.success) {
        await fetchPriceLists();
        reset();
        toast.success(editing ? "Fiyat listesi güncellendi!" : "Fiyat listesi oluşturuldu!");
      } else toast.error(d.message || "Hata oluştu!");
    } catch {
      toast.error("Sunucu hatası!");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (pl: PriceList) => {
    try {
      const d = await (await fetch(`${API}/price-list/${pl.price_list_id}`)).json();
      if (!d.success) return toast.error("Fiyat listesi detayı alınamadı: " + d.message);
      const full = d.data;
      setEditing(full);
      setFormData({
        name: full.name,
        branchId: full.branch_id.toString(),
        isActive: full.is_active,
        items:
          full.items?.map((i: { treatment_type_id?: number; base_price?: number; upper_jaw_price?: number; lower_jaw_price?: number }) => ({
            treatmentTypeId: i.treatment_type_id?.toString() || "",
            price: i.base_price?.toString() || "",
            upperJawPrice: i.upper_jaw_price?.toString() || "",
            lowerJawPrice: i.lower_jaw_price?.toString() || "",
          })) || [],
      });
      setOpen(true);
    } catch {
      toast.error("Sunucu hatası!");
    }
  };

  const toggleStatus = (pl: PriceList) => {
    const newStatus = !pl.is_active;
    const statusText = newStatus ? "aktif" : "deaktif";
    ask({
      title: "Durum değiştirilsin mi?",
      text: `"${pl.name}" fiyat listesini ${statusText} yapmak istediğinizden emin misiniz?`,
      run: async () => {
        try {
          const d = await (
            await fetch(`${API}/price-list/${pl.price_list_id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: newStatus }) })
          ).json();
          if (d.success) {
            await fetchPriceLists();
            toast.success(`Fiyat listesi ${statusText} yapıldı!`);
          } else toast.error(d.message || "Hata oluştu!");
        } catch {
          toast.error("Sunucu hatası!");
        }
      },
    });
  };

  const handleDelete = (pl: PriceList) =>
    ask({
      title: "Fiyat listesi silinsin mi?",
      text: `"${pl.name}" fiyat listesini silmek istediğinizden emin misiniz?`,
      confirmLabel: "Sil",
      destructive: true,
      run: async () => {
        try {
          const d = await (await fetch(`${API}/price-list/${pl.price_list_id}`, { method: "DELETE" })).json();
          if (d.success) {
            await fetchPriceLists();
            toast.success("Fiyat listesi silindi!");
          } else toast.error(d.message || "Hata oluştu!");
        } catch {
          toast.error("Sunucu hatası!");
        }
      },
    });

  const updateItem = (idx: number, field: keyof Item, value: string) =>
    setFormData((f) => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)) }));

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Fiyat Listeleri</CardTitle>
          <CardDescription>Şube bazında tedavi fiyatları. Her şubenin aktif listesi kullanılır.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Yeni Fiyat Listesi
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Liste Adı</TableHead>
                <TableHead>Şube</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">Kalem</TableHead>
                <TableHead>Oluşturulma</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {priceLists.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Henüz fiyat listesi bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                priceLists.map((pl) => (
                  <TableRow key={pl.price_list_id}>
                    <TableCell className="font-medium">{pl.name}</TableCell>
                    <TableCell>{branches.find((b) => b.branch_id === pl.branch_id)?.name || "Bilinmiyor"}</TableCell>
                    <TableCell>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${pl.is_active ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-muted text-muted-foreground"}`}
                      >
                        {pl.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{pl.item_count || 0}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(pl.created_at).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => toggleStatus(pl)}>
                          {pl.is_active ? "Deaktif Et" : "Aktif Et"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(pl)}>
                          <Pencil />
                          Düzenle
                        </Button>
                        <Button size="icon-sm" variant="destructive" aria-label="Sil" onClick={() => handleDelete(pl)}>
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={(o) => !o && reset()}>
        <DialogContent className="sm:max-w-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editing ? "Fiyat Listesi Düzenle" : "Yeni Fiyat Listesi Ekle"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label>Liste Adı *</Label>
                <Input required placeholder="Örn: Genel Fiyat Listesi 2025" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Şube *</Label>
                <NativeSelect required value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}>
                  <option value="">Şube Seçiniz</option>
                  {branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <label className="flex h-8 items-center gap-2 text-sm font-medium">
                <Checkbox checked={formData.isActive} onCheckedChange={(v) => setFormData({ ...formData, isActive: !!v })} />
                Aktif
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Fiyat Kalemleri</Label>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => setFormData({ ...formData, items: [...formData.items, { treatmentTypeId: "", price: "", isPerTooth: false, upperJawPrice: "", lowerJawPrice: "" }] })}
                >
                  <Plus />
                  Kalem Ekle
                </Button>
              </div>
              {formData.items.length === 0 ? (
                <p className="rounded-md border border-dashed py-6 text-center text-sm text-muted-foreground">Henüz fiyat kalemi eklenmemiş. &quot;Kalem Ekle&quot; düğmesine tıklayın.</p>
              ) : (
                <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
                  {formData.items.map((item, idx) => {
                    const tt = treatmentTypes.find((t) => t.treatment_type_id.toString() === item.treatmentTypeId);
                    return (
                      <div key={idx} className="grid items-end gap-2 rounded-md border p-2.5 sm:grid-cols-[1fr_auto_auto]">
                        <div className="space-y-1">
                          <Label className="text-xs">Tedavi Türü *</Label>
                          <NativeSelect required value={item.treatmentTypeId} onChange={(e) => updateItem(idx, "treatmentTypeId", e.target.value)}>
                            <option value="">Tedavi seçiniz</option>
                            {treatmentTypes.map((t) => (
                              <option key={t.treatment_type_id} value={t.treatment_type_id}>
                                {t.name} ({t.category})
                              </option>
                            ))}
                          </NativeSelect>
                        </div>
                        {tt?.is_jaw_specific ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">Üst Çene (₺) *</Label>
                              <Input className="w-28" type="number" step="0.01" min="0" required value={item.upperJawPrice} onChange={(e) => updateItem(idx, "upperJawPrice", e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Alt Çene (₺) *</Label>
                              <Input className="w-28" type="number" step="0.01" min="0" required value={item.lowerJawPrice} onChange={(e) => updateItem(idx, "lowerJawPrice", e.target.value)} />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Label className="text-xs">{tt?.is_per_tooth ? "Diş Başına (₺)" : "Fiyat (₺)"} *</Label>
                            <Input className="w-32" type="number" step="0.01" min="0" required value={item.price} onChange={(e) => updateItem(idx, "price", e.target.value)} />
                          </div>
                        )}
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Kalemi sil"
                          onClick={() => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== idx) })}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={reset}>
                İptal
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Kaydediliyor…" : editing ? "Güncelle" : "Oluştur"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {dialog}
    </Card>
  );
}
