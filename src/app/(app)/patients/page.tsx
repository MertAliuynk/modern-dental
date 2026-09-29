"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { API } from "@/lib/api";

type Branch = { branch_id: number; name: string };
type PatientRow = {
  patient_id: number;
  first_name: string;
  last_name: string;
  phone?: string;
  tc_number?: string;
  branch_name?: string;
  created_at?: string;
};

const PAGE_SIZE = 50;

const SORT_OPTIONS = [
  ["first_name-asc", "Ad (A-Z)"],
  ["first_name-desc", "Ad (Z-A)"],
  ["last_name-asc", "Soyad (A-Z)"],
  ["last_name-desc", "Soyad (Z-A)"],
  ["created_at-desc", "Oluşturma Tarihi (Yeni → Eski)"],
  ["created_at-asc", "Oluşturma Tarihi (Eski → Yeni)"],
  ["branch_name-asc", "Şube (A-Z)"],
  ["branch_name-desc", "Şube (Z-A)"],
] as const;

export default function PatientsListPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("first_name-asc");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [toDelete, setToDelete] = useState<PatientRow | null>(null);

  useEffect(() => {
    fetch(`${API}/branch`)
      .then((r) => r.json())
      .then((d) => d.success && setBranches(d.data));
  }, []);

  useEffect(() => {
    const [orderBy, order] = sort.split("-");
    const params = new URLSearchParams();
    params.append("limit", PAGE_SIZE.toString());
    params.append("offset", ((page - 1) * PAGE_SIZE).toString());
    if (search.trim() !== "") params.append("search", search.trim());
    if (selectedBranch) params.append("branch_id", selectedBranch.toString());
    params.append("orderBy", orderBy);
    params.append("order", order);
    fetch(`${API}/patient?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setPatients(d.data);
          setTotal(d.total || 0);
        } else setPatients([]);
      })
      .catch(() => setPatients([]));
    try {
      setRole(localStorage.getItem("role") || "");
    } catch {}
  }, [page, search, sort, selectedBranch]);

  const handleDelete = async (patient: PatientRow) => {
    setToDelete(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/patient/${patient.patient_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPatients((prev) => prev.filter((p) => p.patient_id !== patient.patient_id));
        toast.success("Hasta silindi.");
      } else toast.error(data.message || "Hasta silinemedi!");
    } catch {
      toast.error("Sunucu hatası!");
    }
  };

  const hidden = role === "doctor";
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-7xl">
      <Card>
        <CardHeader className="gap-3">
          <div>
            <CardTitle className="text-base">Hasta Listesi</CardTitle>
            <CardDescription>Toplam {total} hasta</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <NativeSelect
              className="sm:w-44"
              value={selectedBranch ?? ""}
              onChange={(e) => {
                setSelectedBranch(e.target.value ? Number(e.target.value) : null);
                setPage(1);
              }}
            >
              <option value="">Tüm Şubeler</option>
              {branches.map((b) => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.name}
                </option>
              ))}
            </NativeSelect>
            <div className="relative sm:w-64">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="İsme göre hasta ara…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <span className="shrink-0 text-sm text-muted-foreground">Sırala</span>
              <NativeSelect className="sm:w-64" value={sort} onChange={(e) => setSort(e.target.value)}>
                {SORT_OPTIONS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Ad</TableHead>
                  <TableHead>Soyad</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>TC Kimlik No</TableHead>
                  <TableHead>Şube</TableHead>
                  <TableHead>Oluşturma Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Kayıtlı hasta bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  patients.map((p) => (
                    <TableRow key={p.patient_id} className="cursor-pointer" onClick={() => router.push(`/patients/card?id=${p.patient_id}`)}>
                      <TableCell className="font-medium">{p.first_name}</TableCell>
                      <TableCell className="font-medium">{p.last_name}</TableCell>
                      <TableCell>{hidden ? "•••" : p.phone || "-"}</TableCell>
                      <TableCell>{hidden ? "•••" : p.tc_number || "-"}</TableCell>
                      <TableCell>{p.branch_name || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.created_at
                          ? new Date(p.created_at).toLocaleDateString("tr-TR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/patients/new?id=${p.patient_id}`);
                            }}
                          >
                            <Pencil />
                            Düzenle
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="destructive"
                            aria-label="Sil"
                            onClick={(e) => {
                              e.stopPropagation();
                              setToDelete(p);
                            }}
                          >
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
          <div className="mt-4 flex items-center justify-between gap-2">
            <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Önceki
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">
              {page} / {pageCount}
            </span>
            <Button size="sm" variant="outline" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>
              Sonraki
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hasta silinsin mi?</DialogTitle>
            <DialogDescription>
              {toDelete?.first_name} {toDelete?.last_name} adlı hastayı silmek istediğinize emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Vazgeç
            </Button>
            <Button variant="destructive" onClick={() => toDelete && handleDelete(toDelete)}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
