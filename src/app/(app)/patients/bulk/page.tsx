"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { API } from "@/lib/api";

const MAX_ROWS = 25;

type Doctor = { user_id: number; first_name: string; last_name: string; branch_id?: number };
type Option = { value: number; label: string };
type Row = { firstName: string; lastName: string; tc: string; phone: string; birthDate: string; doctors: Option[]; error: boolean };
type RowError = { index: number; tc: string; error: string };

const emptyRows = (): Row[] => Array.from({ length: MAX_ROWS }, () => ({ firstName: "", lastName: "", tc: "", phone: "", birthDate: "", doctors: [], error: false }));

function DoctorMultiSelect({ options, value, onChange, invalid }: { options: Option[]; value: Option[]; onChange: (v: Option[]) => void; invalid: boolean }) {
  const label = value.length === 0 ? "Doktor seçin…" : value.map((v) => v.label).join(", ");
  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-invalid={invalid}
            className={`flex h-8 w-full min-w-44 items-center justify-between gap-1 rounded-lg border border-input bg-transparent px-2.5 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30 ${
              value.length === 0 ? "text-muted-foreground" : ""
            }`}
          />
        }
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 gap-1 p-1.5">
        {options.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">Doktor bulunamadı</p>
        ) : (
          options.map((o) => {
            const checked = value.some((v) => v.value === o.value);
            return (
              <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                <Checkbox checked={checked} onCheckedChange={(c) => onChange(c ? [...value, o] : value.filter((v) => v.value !== o.value))} />
                {o.label}
              </label>
            );
          })
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function BulkPatientAddPage() {
  const [rows, setRows] = useState<Row[]>(emptyRows);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [errorList, setErrorList] = useState<RowError[]>([]);

  useEffect(() => {
    let branchId: unknown = null;
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        branchId = decoded.branch_id || decoded.branchId || null;
      } catch {}
    }
    fetch(`${API}/user/doctors`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return setDoctors([]);
        setDoctors(branchId !== null && branchId !== undefined && branchId !== "" ? d.data.filter((x: Doctor) => String(x.branch_id) === String(branchId)) : d.data);
      })
      .catch(() => setDoctors([]));
  }, []);

  const handleChange = <K extends keyof Row>(idx: number, field: K, value: Row[K]) =>
    setRows((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    setErrorList([]);

    let hasError = false;
    const checked = rows.map((row) => {
      const { firstName, lastName, tc, phone, birthDate, doctors } = row;
      let error = false;
      if ((firstName || lastName || tc || phone || birthDate || doctors.length) && (!firstName || !lastName || !tc || !phone || !birthDate || doctors.length === 0)) error = true;
      if (tc && !/^\d{11}$/.test(tc)) error = true;
      if (phone && !/^\d{10,11}$/.test(phone)) error = true;
      if (error) hasError = true;
      return { ...row, error };
    });
    setRows(checked);
    if (hasError) {
      setMessage("Eksik veya hatalı bilgi olan satırlar var. Lütfen kontrol edin.");
      setLoading(false);
      return;
    }

    const validRows = rows
      .filter((r) => r.firstName && r.lastName && r.tc && r.phone && r.birthDate && r.doctors.length > 0)
      .map((r) => ({ firstName: r.firstName, lastName: r.lastName, tc: r.tc, phone: r.phone, birthDate: r.birthDate, doctors: r.doctors.map((d) => d.value) }));
    if (validRows.length === 0) {
      setMessage("En az bir hasta bilgisi girilmelidir.");
      setLoading(false);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${API}/patient/bulk`, { method: "POST", headers, body: JSON.stringify({ patients: validRows }) });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          setMessage("Bazı hastalar başarıyla eklendi, aşağıdaki satırlarda hata var:");
          setErrorList(data.errors);
        } else {
          setMessage("Tüm hastalar başarıyla eklendi!");
          setRows(emptyRows());
          setErrorList([]);
        }
      } else if (Array.isArray(data.errors) && data.errors.length > 0) {
        setErrorList(data.errors);
        setMessage(null);
      } else {
        setErrorList([]);
        setMessage(data.message || "Kayıt sırasında hata oluştu.");
      }
    } catch {
      setMessage("Sunucu hatası. Lütfen tekrar deneyin.");
      setErrorList([]);
    } finally {
      setLoading(false);
    }
  };

  const doctorOptions: Option[] = doctors.map((d) => ({ value: d.user_id, label: `${d.first_name} ${d.last_name}` }));
  const success = message?.includes("başarı") && errorList.length === 0;

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Toplu Hasta Ekleme</CardTitle>
          <CardDescription>En fazla {MAX_ROWS} hasta. Boş satırlar dikkate alınmaz; doldurulan satırlarda tüm alanlar zorunludur.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {message && (
            <div
              className={`rounded-md border px-3 py-2 text-sm ${
                success ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              {message}
            </div>
          )}
          {errorList.length > 0 && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
              <p className="font-medium text-destructive">Hatalı Satırlar</p>
              <ul className="mt-1 space-y-0.5">
                {errorList.map((err, i) => (
                  <li key={i}>
                    <b>{err.index}. satır</b> · TC: {err.tc || "-"} · <span className="text-destructive">{err.error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="w-10 px-2 py-2 font-medium">#</th>
                  <th className="px-2 py-2 font-medium">Adı</th>
                  <th className="px-2 py-2 font-medium">Soyadı</th>
                  <th className="px-2 py-2 font-medium">TC kimlik</th>
                  <th className="px-2 py-2 font-medium">Tel no</th>
                  <th className="px-2 py-2 font-medium">Doğum tarihi</th>
                  <th className="px-2 py-2 font-medium">İlgili Doktor(lar)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={`border-t ${row.error ? "bg-destructive/10" : ""}`}>
                    <td className="px-2 py-1.5 text-xs text-muted-foreground tabular-nums">{i + 1}</td>
                    <td className="px-1 py-1.5">
                      <Input value={row.firstName} placeholder="Adı" onChange={(e) => handleChange(i, "firstName", e.target.value)} />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input value={row.lastName} placeholder="Soyadı" onChange={(e) => handleChange(i, "lastName", e.target.value)} />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input value={row.tc} placeholder="TC Kimlik No" maxLength={11} inputMode="numeric" onChange={(e) => handleChange(i, "tc", e.target.value)} />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input value={row.phone} placeholder="Telefon No" maxLength={11} inputMode="tel" onChange={(e) => handleChange(i, "phone", e.target.value)} />
                    </td>
                    <td className="px-1 py-1.5">
                      <Input type="date" value={row.birthDate} onChange={(e) => handleChange(i, "birthDate", e.target.value)} />
                    </td>
                    <td className="px-1 py-1.5">
                      <DoctorMultiSelect options={doctorOptions} value={row.doctors} invalid={row.error} onChange={(v) => handleChange(i, "doctors", v)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Kaydediliyor…" : "Tüm Hastaları Kaydet"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
