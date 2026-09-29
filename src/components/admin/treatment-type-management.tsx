"use client";

import { useEffect, useState } from "react";
import { Check, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useConfirm } from "@/components/confirm-dialog";
import { API } from "@/lib/api";

type TreatmentType = { treatment_type_id: number; name: string; category: string; is_per_tooth: boolean; is_jaw_specific: boolean; feedback_intervals?: string[] };

const FEEDBACK_OPTIONS = [
  { value: "1_week", label: "1 Hafta" },
  { value: "1_month", label: "1 Ay" },
  { value: "3_months", label: "3 Ay" },
  { value: "6_months", label: "6 Ay" },
];
const EMPTY = { name: "", category: "", isPerTooth: false, isJawSpecific: false, feedbackIntervals: [] as string[] };

const Flag = ({ on }: { on: boolean }) => (on ? <Check className="mx-auto size-4" aria-label="Evet" /> : <Minus className="mx-auto size-4 text-muted-foreground" aria-label="Hayır" />);

export function TreatmentTypeManagement() {
  const [treatments, setTreatments] = useState<TreatmentType[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TreatmentType | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const { ask, dialog } = useConfirm();

  const fetchTreatments = async () => {
    try {
      const d = await (await fetch(`${API}/treatment-type`)).json();
      if (d.success) setTreatments(d.data);
    } catch {}
  };

  useEffect(() => {
    fetchTreatments();
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
      const res = await fetch(editing ? `${API}/treatment-type/${editing.treatment_type_id}` : `${API}/treatment-type`, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const d = await res.json();
      if (d.success) {
        await fetchTreatments();
        reset();
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (t: TreatmentType) =>
    ask({
      title: "Tedavi türü silinsin mi?",
      text: `"${t.name}" tedavi türünü silmek istediğinizden emin misiniz?`,
      confirmLabel: "Sil",
      destructive: true,
      run: async () => {
        try {
          const d = await (await fetch(`${API}/treatment-type/${t.treatment_type_id}`, { method: "DELETE" })).json();
          if (d.success) {
            await fetchTreatments();
            toast.success("Tedavi türü silindi!");
          } else toast.error(d.message || "Hata oluştu!");
        } catch {
          toast.error("Sunucu hatası!");
        }
      },
    });

  const toggleInterval = (v: string) =>
    setFormData((f) => ({ ...f, feedbackIntervals: f.feedbackIntervals.includes(v) ? f.feedbackIntervals.filter((i) => i !== v) : [...f.feedbackIntervals, v] }));

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Tedavi Türleri</CardTitle>
          <CardDescription>Tedavi ekleme ekranında seçilebilen tedaviler ve takip süreleri.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Yeni Tedavi Türü
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Tedavi Adı</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-center">Diş Bazlı</TableHead>
                <TableHead className="text-center">Çene Bazlı</TableHead>
                <TableHead>Takip Süreleri</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treatments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Henüz tedavi türü bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                treatments.map((t) => (
                  <TableRow key={t.treatment_type_id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{t.category}</span>
                    </TableCell>
                    <TableCell>
                      <Flag on={t.is_per_tooth} />
                    </TableCell>
                    <TableCell>
                      <Flag on={t.is_jaw_specific} />
                    </TableCell>
                    <TableCell className="text-xs">
                      {t.feedback_intervals && t.feedback_intervals.length > 0
                        ? t.feedback_intervals.map((i) => FEEDBACK_OPTIONS.find((o) => o.value === i)?.label || i).join(", ")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(t);
                            setFormData({ name: t.name, category: t.category, isPerTooth: t.is_per_tooth, isJawSpecific: t.is_jaw_specific, feedbackIntervals: t.feedback_intervals || [] });
                            setOpen(true);
                          }}
                        >
                          <Pencil />
                          Düzenle
                        </Button>
                        <Button size="icon-sm" variant="destructive" aria-label="Sil" onClick={() => handleDelete(t)}>
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
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editing ? "Tedavi Türü Düzenle" : "Yeni Tedavi Türü Ekle"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label>Tedavi Adı *</Label>
              <Input required placeholder="Örn: Dolgu, Kanal Tedavisi, Diş Teli" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Kategori *</Label>
              <Input required placeholder="Örn: Restoratif, Endodonti, Ortodonti" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-2 rounded-md border p-2.5">
                <Checkbox className="mt-0.5" checked={formData.isPerTooth} onCheckedChange={(v) => setFormData({ ...formData, isPerTooth: !!v })} />
                <span>
                  <span className="block text-sm font-medium">Diş Bazlı Tedavi</span>
                  <span className="block text-xs text-muted-foreground">Her diş için ayrı fiyatlandırılır</span>
                </span>
              </label>
              <label className="flex items-start gap-2 rounded-md border p-2.5">
                <Checkbox className="mt-0.5" checked={formData.isJawSpecific} onCheckedChange={(v) => setFormData({ ...formData, isJawSpecific: !!v })} />
                <span>
                  <span className="block text-sm font-medium">Çene Bazlı Tedavi</span>
                  <span className="block text-xs text-muted-foreground">Alt/üst çene için farklı fiyat</span>
                </span>
              </label>
            </div>
            <div className="space-y-1.5">
              <Label>Takip Süreleri</Label>
              <div className="flex flex-wrap gap-3">
                {FEEDBACK_OPTIONS.map((o) => (
                  <label key={o.value} className="flex items-center gap-1.5 text-sm">
                    <Checkbox checked={formData.feedbackIntervals.includes(o.value)} onCheckedChange={() => toggleInterval(o.value)} />
                    {o.label}
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Tedavi sonrası takip yapılacak süreleri seçiniz.</p>
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
