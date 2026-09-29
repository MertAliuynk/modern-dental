"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useConfirm } from "@/components/confirm-dialog";
import { API } from "@/lib/api";

type Order = { id: number; doctor_id: number; order_num: number };
type Doctor = { user_id: number; first_name: string; last_name: string; branch_id?: number };
type Branch = { branch_id: number; name: string };

export function DoctorOrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({ doctor_id: "", order_num: "" });
  const [error, setError] = useState("");
  const { ask, dialog } = useConfirm();

  const fetchOrders = async () => {
    try {
      const d = await (await fetch(`${API}/doctor-order/doctor-order`)).json();
      if (d.success) setOrders(d.data);
    } catch {
      setError("Sıralar alınamadı");
    }
  };

  useEffect(() => {
    fetchOrders();
    const token = localStorage.getItem("token");
    fetch(`${API}/user/doctors/by-branch`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.json())
      .then((d) => d.success && setDoctors(d.data))
      .catch(() => {});
    fetch(`${API}/branch`)
      .then((r) => r.json())
      .then((d) => d.success && setBranches(d.data || []))
      .catch(() => {});
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.doctor_id || !form.order_num) return setError("Doktor ve sıra numarası zorunlu");
    try {
      const d = await (
        await fetch(`${API}/doctor-order/doctor-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ doctor_id: form.doctor_id, order_num: Number(form.order_num) }),
        })
      ).json();
      if (d.success) {
        setForm({ doctor_id: "", order_num: "" });
        fetchOrders();
      } else setError(d.message || "Ekleme hatası");
    } catch {
      setError("Sunucu hatası");
    }
  };

  const handleDelete = (id: number) =>
    ask({
      title: "Doktor sırası silinsin mi?",
      text: "Bu doktor sırasını silmek istediğinize emin misiniz?",
      confirmLabel: "Sil",
      destructive: true,
      run: async () => {
        try {
          const d = await (await fetch(`${API}/doctor-order/doctor-order/${id}`, { method: "DELETE" })).json();
          if (d.success) fetchOrders();
          else setError(d.message || "Silme hatası");
        } catch {
          setError("Sunucu hatası");
        }
      },
    });

  const branchName = (id?: number) => branches.find((b) => b.branch_id === id)?.name;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Doktor Sıraları</CardTitle>
        <CardDescription>Takvim ve ana sayfada hekim sütunlarının sırası. Sırası olmayan hekimler sona eklenir.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleAdd} className="flex flex-col gap-2 sm:flex-row">
          <NativeSelect className="sm:w-80" value={form.doctor_id} onChange={(e) => setForm((f) => ({ ...f, doctor_id: e.target.value }))}>
            <option value="">Doktor Seçiniz</option>
            {doctors.map((d) => {
              const b = branchName(d.branch_id);
              return (
                <option key={d.user_id} value={d.user_id}>
                  {d.first_name} {d.last_name} {b ? `- ${b}` : ""}
                </option>
              );
            })}
          </NativeSelect>
          <Input className="sm:w-28" type="number" min={1} placeholder="Sıra No" value={form.order_num} onChange={(e) => setForm((f) => ({ ...f, order_num: e.target.value }))} />
          <Button type="submit">
            <Plus className="size-4" />
            Ekle
          </Button>
        </form>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-20">Sıra</TableHead>
                <TableHead>Doktor</TableHead>
                <TableHead>Şube</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Henüz doktor sırası eklenmemiş.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => {
                  const doctor = doctors.find((d) => String(d.user_id) === String(o.doctor_id));
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium tabular-nums">{o.order_num}</TableCell>
                      <TableCell>{doctor ? `${doctor.first_name} ${doctor.last_name}` : ""}</TableCell>
                      <TableCell>{(doctor && branchName(doctor.branch_id)) || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon-sm" variant="destructive" aria-label="Sil" onClick={() => handleDelete(o.id)}>
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {dialog}
    </Card>
  );
}
