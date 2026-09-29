"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useConfirm } from "@/components/confirm-dialog";
import { API } from "@/lib/api";

type Branch = { branch_id: number; name: string; address?: string; permanent_doctor_count?: number; created_at?: string };
const EMPTY = { name: "", address: "", permanent_doctor_count: 3 };

export function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState(EMPTY);
  const { ask, dialog } = useConfirm();

  const fetchBranches = async () => {
    try {
      const d = await (await fetch(`${API}/branch`)).json();
      if (d.success) setBranches(d.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const reset = () => {
    setEditing(null);
    setForm(EMPTY);
    setOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Şube adı zorunludur");
    setLoading(true);
    try {
      const res = await fetch(editing ? `${API}/branch/${editing.branch_id}` : `${API}/branch`, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), address: form.address || null, permanent_doctor_count: Number(form.permanent_doctor_count) }),
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || "İşlem başarısız");
      await fetchBranches();
      reset();
      toast.success(editing ? "Şube güncellendi" : "Şube eklendi");
    } catch (err) {
      toast.error((err as Error)?.message || "Sunucu hatası");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (b: Branch) =>
    ask({
      title: "Şube silinsin mi?",
      text: `"${b.name}" şubesini silmek istediğinize emin misiniz?`,
      confirmLabel: "Sil",
      destructive: true,
      run: async () => {
        try {
          const res = await fetch(`${API}/branch/${b.branch_id}`, { method: "DELETE" });
          const d = await res.json();
          if (!res.ok || !d.success) throw new Error(d.message || "Silme başarısız");
          await fetchBranches();
          toast.success("Şube silindi");
        } catch (err) {
          toast.error((err as Error)?.message || "Sunucu hatası");
        }
      },
    });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Şubeler</CardTitle>
          <CardDescription>&quot;Devamlı doktor sayısı&quot; takvimde bir sayfada gösterilen hekim sütunu sayısıdır.</CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setForm(EMPTY);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          Yeni Şube
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Ad</TableHead>
                <TableHead>Adres</TableHead>
                <TableHead className="text-right">Devamlı Doktor</TableHead>
                <TableHead>Oluşturma</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Henüz şube bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                branches.map((b) => (
                  <TableRow key={b.branch_id}>
                    <TableCell className="font-medium">{b.name}</TableCell>
                    <TableCell className="max-w-72 truncate">{b.address || "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">{b.permanent_doctor_count ?? "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{b.created_at ? new Date(b.created_at).toLocaleDateString("tr-TR") : "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(b);
                            setForm({ name: b.name || "", address: b.address || "", permanent_doctor_count: typeof b.permanent_doctor_count === "number" ? b.permanent_doctor_count : 3 });
                            setOpen(true);
                          }}
                        >
                          <Pencil />
                          Düzenle
                        </Button>
                        <Button size="icon-sm" variant="destructive" aria-label="Sil" onClick={() => handleDelete(b)}>
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
        <DialogContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editing ? "Şube Düzenle" : "Yeni Şube Ekle"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label>Şube Adı</Label>
              <Input placeholder="Örn. Merkez" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Adres (opsiyonel)</Label>
              <Textarea placeholder="Adres bilgisi" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Devamlı Doktor Sayısı</Label>
              <Input type="number" min={1} max={20} value={form.permanent_doctor_count} onChange={(e) => setForm((f) => ({ ...f, permanent_doctor_count: Number(e.target.value) }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={reset}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={loading}>
                {editing ? "Güncelle" : "Kaydet"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {dialog}
    </Card>
  );
}
