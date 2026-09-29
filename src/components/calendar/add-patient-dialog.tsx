"use client";

import { useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { API } from "@/lib/api";

type Doctor = { user_id: number; first_name: string; last_name: string };
export type AddedPatient = Record<string, unknown> & { patient_id?: number; id?: number; first_name?: string; last_name?: string; phone?: string };

const EMPTY = { firstName: "", lastName: "", tcNumber: "", phone: "", birthDate: "", doctorIds: [] as string[] };

export function AddPatientDialog({
  open,
  onClose,
  doctors,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  doctors: Doctor[];
  onSave: (patient: AddedPatient) => void;
}) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [added, setAdded] = useState<AddedPatient | null>(null);

  const save = async () => {
    setErrors([]);
    const missing: string[] = [];
    if (!form.firstName) missing.push("Ad");
    if (!form.lastName) missing.push("Soyad");
    if (!form.tcNumber) missing.push("TC Kimlik No");
    if (!form.phone) missing.push("Telefon No");
    if (!form.birthDate) missing.push("Doğum Tarihi");
    if (form.doctorIds.length === 0) missing.push("Doktor Seçimi");
    if (missing.length > 0) return setErrors(missing.map((f) => `${f} alanı boş bırakılamaz.`));
    if (!/^\d{11}$/.test(form.tcNumber)) return setErrors(["TC Kimlik No 11 haneli olmalı."]);
    if (!/^\d{10,11}$/.test(form.phone)) return setErrors(["Telefon numarası 10 veya 11 haneli olmalı."]);

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API}/patient`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          tc: form.tcNumber,
          phone: form.phone,
          birthDate: form.birthDate,
          doctors: form.doctorIds,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAdded(data.data);
        setForm(EMPTY);
      } else {
        setErrors([data.message || "Kayıt sırasında hata oluştu."]);
      }
    } catch {
      setErrors(["Sunucu hatası. Lütfen tekrar deneyin."]);
    } finally {
      setLoading(false);
    }
  };

  const addedId = added ? added.patient_id || added.id || "" : "";

  return (
    <Dialog open={open || !!added} onOpenChange={(o) => !o && !added && onClose()}>
      <DialogContent className="sm:max-w-md">
        {added ? (
          <>
            <DialogHeader>
              <DialogTitle>Hasta Eklendi</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5 text-sm">
              <p>
                <span className="text-muted-foreground">Ad Soyad:</span>{" "}
                <Link href={`/patients/card?id=${addedId}`} className="font-medium underline">
                  {String(added.first_name || added.firstName || "")} {String(added.last_name || added.lastName || "")}
                </Link>
              </p>
              <p>
                <span className="text-muted-foreground">TC Kimlik No:</span> {String(added.tc_number || added.tc || "")}
              </p>
              <p>
                <span className="text-muted-foreground">Telefon No:</span> {String(added.phone || "")}
              </p>
              <p>
                <span className="text-muted-foreground">Doğum Tarihi:</span> {String(added.birth_date || added.birthDate || "").substring(0, 10)}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => (window.location.href = `/patients/new?id=${addedId}`)}>
                Düzenle
              </Button>
              <Button
                onClick={() => {
                  onSave(added);
                  setAdded(null);
                  onClose();
                }}
              >
                Kapat
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Hasta Ekle</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Ad</Label>
                <Input value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Soyad</Label>
                <Input value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>TC Kimlik No</Label>
                <Input
                  inputMode="numeric"
                  maxLength={11}
                  value={form.tcNumber}
                  onChange={(e) => setForm((f) => ({ ...f, tcNumber: e.target.value.replace(/[^0-9]/g, "") }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Telefon No</Label>
                <Input inputMode="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/[^0-9]/g, "") }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Doğum Tarihi</Label>
                <Input type="date" value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>İlgili Doktor(lar)</Label>
                <div className="flex max-h-32 flex-col gap-1.5 overflow-y-auto rounded-md border p-2">
                  {doctors.map((d) => {
                    const id = String(d.user_id);
                    return (
                      <label key={id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.doctorIds.includes(id)}
                          onCheckedChange={(v) =>
                            setForm((f) => ({ ...f, doctorIds: v ? [...f.doctorIds, id] : f.doctorIds.filter((x) => x !== id) }))
                          }
                        />
                        {d.first_name} {d.last_name}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            {errors.length > 0 && (
              <ul className="space-y-0.5 text-sm text-destructive">
                {errors.map((e) => (
                  <li key={e}>• {e}</li>
                ))}
              </ul>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                İptal
              </Button>
              <Button onClick={save} disabled={loading}>
                {loading ? "Kaydediliyor…" : "Kaydet"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
