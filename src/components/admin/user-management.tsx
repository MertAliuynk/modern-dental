"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useConfirm } from "@/components/confirm-dialog";
import { API } from "@/lib/api";

type User = { user_id: number; username: string; role: string; branch_id?: number; branch_name?: string; first_name: string; last_name: string; created_at: string };
type Branch = { branch_id: number; name: string };

const ROLE_LABELS: Record<string, string> = { admin: "Admin", branch_manager: "Şube Müdürü", doctor: "Doktor", receptionist: "Resepsiyonist" };
const EMPTY = { username: "", password: "", role: "", branchId: "" as string | number, firstName: "", lastName: "" };

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const { ask, dialog } = useConfirm();

  const fetchUsers = async () => {
    try {
      const d = await (await fetch(`${API}/user`)).json();
      if (d.success) setUsers(d.data);
    } catch {}
  };

  useEffect(() => {
    fetchUsers();
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
      const res = await fetch(editing ? `${API}/user/${editing.user_id}` : `${API}/user`, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const d = await res.json();
      if (d.success) {
        await fetchUsers();
        reset();
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (u: User) =>
    ask({
      title: "Kullanıcı silinsin mi?",
      text: `"${u.username}" kullanıcısını silmek istediğinizden emin misiniz?`,
      confirmLabel: "Sil",
      destructive: true,
      run: async () => {
        try {
          const d = await (await fetch(`${API}/user/${u.user_id}`, { method: "DELETE" })).json();
          if (d.success) await fetchUsers();
        } catch {}
      },
    });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Kullanıcı Yönetimi</CardTitle>
          <CardDescription>Sisteme giriş yapabilen hesaplar ve yetkileri.</CardDescription>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="size-4" />
          Yeni Kullanıcı
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Ad Soyad</TableHead>
                <TableHead>Kullanıcı Adı</TableHead>
                <TableHead>Yetki</TableHead>
                <TableHead>Şube</TableHead>
                <TableHead>Oluşturma</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Henüz kullanıcı bulunmuyor.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">
                      {u.first_name} {u.last_name}
                    </TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{ROLE_LABELS[u.role] || u.role}</span>
                    </TableCell>
                    <TableCell>{u.branch_name || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(u.created_at).toLocaleDateString("tr-TR")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditing(u);
                            setFormData({ username: u.username, password: "", role: u.role, branchId: u.branch_id || "", firstName: u.first_name, lastName: u.last_name });
                            setOpen(true);
                          }}
                        >
                          <Pencil />
                          Düzenle
                        </Button>
                        <Button size="icon-sm" variant="destructive" aria-label="Sil" onClick={() => handleDelete(u)}>
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
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editing ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Ad *</Label>
                <Input required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Soyad *</Label>
                <Input required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Kullanıcı Adı *</Label>
                <Input required value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Şifre {editing ? <span className="font-normal text-muted-foreground">(değiştirmek için doldurun)</span> : "*"}</Label>
                <Input type="password" required={!editing} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Yetki *</Label>
                <NativeSelect required value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="">Seçiniz</option>
                  {Object.entries(ROLE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label>Şube</Label>
                <NativeSelect value={formData.branchId} onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}>
                  <option value="">Şube Seçiniz</option>
                  {branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
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
