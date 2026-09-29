"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { API } from "@/lib/api";
import { appointmentSmsText } from "@/lib/appointments";
import { AddPatientDialog } from "@/components/calendar/add-patient-dialog";

export const APPOINTMENT_TYPES = [
  "Muayene",
  "Özel",
  "Kontrol",
  "İmplant",
  "Protez",
  "Peridontoloji",
  "Pedodonti",
  "Dolgu",
  "Kanal Tedavisi",
  "Beyazlatma",
  "Ölçü",
  "İmplant üstü ölçü",
  "altyapı prova",
  "dentin prova",
  "protez bitim",
  "diş kesimi",
  "vuruk alma",
  "çekim",
  "iyileştirme başlığı",
  "botoks",
  "gece plağı",
  "abutment takımı",
  "metal prova",
  "geçici",
  "dikiş alımı",
  "implant kontrol filmi",
  "kaplama sökümü",
  "fiber-metal post",
  "kanal pansuman",
  "gömülü çekim",
  "cerrahi çekim",
  "genel anestezi",
  "zirkonyum kor prova",
  "rezin prova",
  "simantasyon",
];

export const DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120];

type Doctor = { user_id: number; first_name: string; last_name: string };
type Branch = { branch_id: number; name: string };
type PatientRow = { patient_id: number; first_name: string; last_name: string; phone?: string; tc_number?: string; branch_name?: string };
type User = { user_id?: number } | null;

export async function sendAppointmentSms(patientId: string | number, phone: string, message: string) {
  try {
    const token = localStorage.getItem("token");
    const response = await fetch("/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ patientIds: [patientId], templateId: null, customMessage: message, phone }),
    });
    const data = await response.json();
    if (response.ok && data?.success) toast.success("SMS gönderildi");
    else toast.error(data?.message || "SMS gönderilemedi");
  } catch {
    toast.error("SMS gönderiminde hata");
  }
}

export function CreateAppointmentDialog({
  open,
  onClose,
  onCreated,
  when,
  initialDoctorId,
  role,
  user,
  branchId,
  branchName,
  doctors,
  branches,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  when: Date | null;
  initialDoctorId: string;
  role: string;
  user: User;
  branchId: number | string | null;
  branchName: string;
  doctors: Doctor[];
  branches: Branch[];
}) {
  const [doctorId, setDoctorId] = useState(initialDoctorId);
  const [patientId, setPatientId] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<PatientRow | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [patientList, setPatientList] = useState<PatientRow[]>([]);
  const [patientOffset, setPatientOffset] = useState(0);
  const [searchBranchId, setSearchBranchId] = useState("");
  const [appointmentType, setAppointmentType] = useState("");
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(30);
  const [saatKapa, setSaatKapa] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Her açılışta eski sitedeki gibi form sıfırlanır (süre ve tür korunur).
  useEffect(() => {
    if (!open) return;
    setDoctorId(initialDoctorId);
    setNotes("");
    setPatientId("");
    setSelectedPatient(null);
    setPatientSearch("");
    setPatientOffset(0);
    setPatientList([]);
  }, [open, initialDoctorId]);

  const searchPatients = async (q: string, offset: number, branch: string) => {
    const params = new URLSearchParams();
    params.set("limit", "20");
    params.set("offset", String(offset));
    const normalized = q.trim().replace(/\s+/g, " ").toLowerCase();
    if (normalized) params.set("search", normalized);
    if (branch) params.set("branch_id", branch);
    const res = await fetch(`${API}/patient?${params.toString()}`);
    const data = await res.json();
    if (!data?.success) return;
    let list: PatientRow[] = data.data;
    if (normalized) {
      list = list.filter((p) => {
        const full = `${p.first_name || ""} ${p.last_name || ""}`.trim().replace(/\s+/g, " ").toLowerCase();
        return full.includes(normalized) || (p.phone || "").toLowerCase().includes(normalized) || (p.tc_number || "").toLowerCase().includes(normalized);
      });
    }
    setPatientList((prev) => (offset === 0 ? list : [...prev, ...list]));
    setPatientOffset(offset);
  };

  const pickPatient = (p: PatientRow) => {
    setPatientId(String(p.patient_id));
    setPatientSearch(`${p.first_name} ${p.last_name} - ${p.phone}`);
    setSelectedPatient(p);
    setPatientList([]);
  };

  const effectiveDoctorId = role === "doctor" ? (user?.user_id ? String(user.user_id) : "") : doctorId;

  const create = async () => {
    if (!when || !effectiveDoctorId) return toast.error(role === "doctor" ? "Kullanıcı bilgisi bulunamadı" : "Lütfen doktor seçin");
    if (!saatKapa && !patientId) return toast.error("Lütfen hasta seçin");
    const body = saatKapa
      ? {
          patientId: null,
          doctorId: effectiveDoctorId,
          appointmentTime: when.toISOString(),
          duration,
          notes: notes.trim() ? `SAAT KAPATILDI - ${notes.trim()}` : "SAAT KAPATILDI",
          branchId,
          status: "saatkapatildi",
          created_by: user?.user_id || null,
        }
      : {
          patientId,
          doctorId: effectiveDoctorId,
          appointmentTime: when.toISOString(),
          duration,
          notes: `${appointmentType ? `${appointmentType} - ` : ""}${notes || ""}`,
          branchId,
          created_by: user?.user_id || null,
        };
    setSaving(true);
    try {
      const res = await fetch(`${API}/appointment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok && data?.success) {
        onClose();
        onCreated();
        setNotes("");
      } else toast.error(data?.message || "Randevu oluşturulamadı");
    } catch {
      toast.error("Sunucu hatası");
    } finally {
      setSaving(false);
    }
  };

  const smsName = selectedPatient ? `${selectedPatient.first_name || ""} ${selectedPatient.last_name || ""}`.trim() : patientSearch.split(" - ")[0] || "Hasta";
  const smsText = appointmentSmsText(smsName, branchName, when);

  const sendSms = async () => {
    if (!patientId) return toast.error("Lütfen hasta seçin");
    if (!when) return toast.error("Lütfen tarih/saat seçin");
    let patient: PatientRow | null = selectedPatient;
    if (!patient) {
      const resP = await fetch(`${API}/patient/${patientId}`);
      const dataP = await resP.json();
      if (dataP?.success) patient = dataP.data;
    }
    if (!patient?.phone) return toast.error("Hastanın telefon numarası bulunamadı");
    const name = `${patient.first_name || ""} ${patient.last_name || ""}`.trim();
    await sendAppointmentSms(patientId, patient.phone, appointmentSmsText(name, branchName, when));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Randevu Oluştur</DialogTitle>
          <DialogDescription>
            {when ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "full", timeStyle: "short" }).format(when) : "Tarih seçilmedi"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          {role !== "doctor" && (
            <div className="space-y-1.5">
              <Label>Doktor</Label>
              <NativeSelect value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                <option value="">Seçiniz</option>
                {doctors.map((d) => (
                  <option key={d.user_id} value={String(d.user_id)}>
                    {d.first_name} {d.last_name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          )}

          {!saatKapa && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Hasta</Label>
                <Button type="button" size="xs" variant="outline" onClick={() => setAddPatientOpen(true)}>
                  <UserPlus />
                  Hasta Ekle
                </Button>
              </div>
              <NativeSelect
                value={searchBranchId}
                onChange={(e) => {
                  setSearchBranchId(e.target.value);
                  searchPatients(patientSearch.trim(), 0, e.target.value);
                }}
              >
                <option value="">Tüm Şubeler</option>
                {branches.map((b) => (
                  <option key={b.branch_id} value={String(b.branch_id)}>
                    {b.name}
                  </option>
                ))}
              </NativeSelect>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-8"
                  value={patientSearch}
                  placeholder="İsim/TC/Telefon ile ara"
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    searchPatients(e.target.value, 0, searchBranchId);
                  }}
                />
              </div>
              {patientList.length > 0 && (
                <div className="max-h-48 overflow-y-auto rounded-md border">
                  {patientList.map((p) => (
                    <button key={p.patient_id} type="button" onClick={() => pickPatient(p)} className="block w-full px-2.5 py-1.5 text-left hover:bg-accent">
                      <span className="text-sm font-medium">
                        {p.first_name} {p.last_name}
                      </span>
                      {p.branch_name && <span className="ml-1.5 text-xs text-muted-foreground">({p.branch_name})</span>}
                      <span className="block text-xs text-muted-foreground">
                        {p.phone}
                        {p.tc_number ? ` • ${p.tc_number}` : ""}
                      </span>
                    </button>
                  ))}
                  <div className="flex justify-center border-t p-1.5">
                    <Button size="xs" variant="ghost" onClick={() => searchPatients(patientSearch, patientOffset + 20, searchBranchId)}>
                      Daha fazla
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!saatKapa && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Randevu Türü</Label>
                <NativeSelect value={appointmentType} onChange={(e) => setAppointmentType(e.target.value)}>
                  <option value="">Tür seçiniz</option>
                  {APPOINTMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-1.5">
                <Label>Not</Label>
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          )}

          {saatKapa && (
            <div className="space-y-1.5">
              <Label>Açıklama (opsiyonel)</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Kapatma nedeni" />
            </div>
          )}

          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1.5">
              <Label>Süre</Label>
              <NativeSelect value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
                {DURATIONS.map((m) => (
                  <option key={m} value={m}>
                    {m} dk
                  </option>
                ))}
              </NativeSelect>
            </div>
            <label className="flex h-8 items-center gap-2 text-sm font-medium">
              <Checkbox checked={saatKapa} onCheckedChange={(v) => setSaatKapa(!!v)} />
              Saat Kapa
            </label>
          </div>

          {!saatKapa && (
            <div className="space-y-2 rounded-md border bg-muted/40 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <MessageSquare className="size-3.5" />
                SMS Önizleme
              </p>
              <p className="text-sm">{smsText}</p>
              <Button size="sm" variant="outline" onClick={sendSms}>
                SMS Gönder
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={create} disabled={saving}>
            {saving ? "Oluşturuluyor…" : "Oluştur"}
          </Button>
        </DialogFooter>

        <AddPatientDialog
          open={addPatientOpen}
          onClose={() => setAddPatientOpen(false)}
          doctors={doctors}
          onSave={(p) => {
            setAddPatientOpen(false);
            const id = p.patient_id || p.id;
            if (!id) return;
            setPatientId(String(id));
            setSelectedPatient({
              patient_id: Number(id),
              first_name: String(p.first_name || p.firstName || ""),
              last_name: String(p.last_name || p.lastName || ""),
              phone: p.phone,
            });
            setPatientSearch(`${String(p.first_name || p.firstName || "")} ${String(p.last_name || p.lastName || "")} - ${p.phone || ""}`.trim());
            setPatientList([]);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
