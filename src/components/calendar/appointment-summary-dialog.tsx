"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { API } from "@/lib/api";
import { appointmentSmsText, localDateStr } from "@/lib/appointments";
import { DURATIONS, sendAppointmentSms } from "@/components/calendar/create-appointment-dialog";

export type RawAppointment = {
  appointment_id: number;
  appointment_time: string;
  duration_minutes?: number;
  notes?: string;
  status?: string;
  status_tr?: string;
  patient_id?: number;
  patient_name?: string;
  doctor_id?: number;
  doctor_first_name?: string;
  doctor_last_name?: string;
  branch_name?: string;
  created_by_first_name?: string;
  created_by_last_name?: string;
  created_at?: string;
};

type Patient = { patient_id: number; first_name?: string; last_name?: string; phone?: string; tc_number?: string };

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium break-words whitespace-pre-wrap">{children}</div>
    </div>
  );
}

export function AppointmentSummaryDialog({
  appointment,
  onClose,
  onChanged,
  branchName,
}: {
  appointment: RawAppointment | null;
  onClose: () => void;
  onChanged: () => void;
  branchName: string;
}) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [fields, setFields] = useState({ date: "", time: "", duration: 30, notes: "", status: "scheduled" });
  const [updating, setUpdating] = useState(false);
  const [noteError, setNoteError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!appointment) return;
    const dt = new Date(appointment.appointment_time);
    setFields({
      date: localDateStr(dt),
      time: dt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", hour12: false }),
      duration: appointment.duration_minutes || 30,
      notes: appointment.notes || "",
      status: appointment.status || "scheduled",
    });
    setNoteError(false);
    setPatient(null);
    if (appointment.patient_id) {
      fetch(`${API}/patient/${appointment.patient_id}`)
        .then((r) => r.json())
        .then((d) => d?.success && setPatient(d.data))
        .catch(() => {});
    }
  }, [appointment]);

  if (!appointment) return null;
  const a = appointment;

  const update = async () => {
    const statusChanged = (fields.status || "") !== (a.status || "scheduled");
    if (statusChanged && (fields.notes || "").trim() === (a.notes || "").trim()) {
      toast.error("Durum değiştirirken not eklenmesi zorunludur. Lütfen not alanına açıklama ekleyin.");
      setNoteError(true);
      setTimeout(() => setNoteError(false), 3000);
      return;
    }
    setUpdating(true);
    try {
      const iso = new Date(`${fields.date}T${fields.time}`).toISOString();
      const res1 = await fetch(`${API}/appointment/${a.appointment_id}/time-duration`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentTime: iso, duration: fields.duration }),
      });
      const data1 = await res1.json();
      if (!(res1.ok && data1?.success)) return toast.error(data1?.message || "Saat/Süre güncellenemedi");

      if ((fields.notes || "") !== (a.notes || "")) {
        const res2 = await fetch(`${API}/appointment/${a.appointment_id}/notes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: fields.notes }),
        });
        const data2 = await res2.json();
        if (!(res2.ok && data2?.success)) return toast.error(data2?.message || "Not güncellenemedi");
      }

      if (statusChanged) {
        const res3 = await fetch(`${API}/appointment/${a.appointment_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: fields.status, notes: fields.notes ?? a.notes ?? "" }),
        });
        const data3 = await res3.json();
        if (!(res3.ok && data3?.success)) return toast.error(data3?.message || "Durum güncellenemedi");
      }
      onClose();
      onChanged();
    } catch {
      toast.error("Güncelleme sırasında hata oluştu");
    } finally {
      setUpdating(false);
    }
  };

  const remove = async () => {
    setConfirmDelete(false);
    try {
      const res = await fetch(`${API}/appointment/${a.appointment_id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data?.success) {
        onClose();
        onChanged();
      } else toast.error(data?.message || "Randevu silinemedi");
    } catch {
      toast.error("Sunucu hatası");
    }
  };

  const patientName = patient ? `${patient.first_name || ""} ${patient.last_name || ""}`.trim() : "";
  const smsText = patient ? appointmentSmsText(patientName, a.branch_name || branchName, new Date(a.appointment_time)) : "";
  const createdBy =
    a.created_by_first_name || a.created_by_last_name ? `${a.created_by_first_name || ""} ${a.created_by_last_name || ""}`.trim() : "Bilinmiyor";

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Randevu Özeti</DialogTitle>
            <DialogDescription>
              Oluşturan: {createdBy} · {a.created_at ? new Date(a.created_at).toLocaleString("tr-TR") : "Bilinmiyor"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
            <Field label="Hasta">
              {a.patient_id ? (
                <Link href={`/patients/card?id=${a.patient_id}`} className="underline underline-offset-2" title="Hasta kartını aç">
                  {a.patient_name || "-"}
                </Link>
              ) : (
                a.patient_name || "-"
              )}
            </Field>
            <Field label="Doktor">
              {a.doctor_first_name} {a.doctor_last_name}
            </Field>
            <Field label="Tarih">{new Date(a.appointment_time).toLocaleString("tr-TR")}</Field>
            <Field label="Süre">{a.duration_minutes || 30} dk</Field>
            <Field label="TC">{patient?.tc_number || "-"}</Field>
            <Field label="Telefon">{patient?.phone || "-"}</Field>
            <Field label="Not" wide>
              {a.notes || "-"}
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Gün</Label>
              <Input type="date" value={fields.date} onChange={(e) => setFields((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Saat</Label>
              <Input type="time" step={900} value={fields.time} onChange={(e) => setFields((f) => ({ ...f, time: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Süre</Label>
              <NativeSelect value={fields.duration} onChange={(e) => setFields((f) => ({ ...f, duration: Number(e.target.value) }))}>
                {DURATIONS.map((m) => (
                  <option key={m} value={m}>
                    {m} dk
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5 sm:col-span-3">
              <Label>
                Not <span className="font-normal text-muted-foreground">— durum değiştirirken lütfen açıklama ekleyin.</span>
              </Label>
              <Textarea rows={3} value={fields.notes} aria-invalid={noteError} onChange={(e) => setFields((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-3">
              <Label>Durum</Label>
              <NativeSelect value={fields.status} onChange={(e) => setFields((f) => ({ ...f, status: e.target.value }))}>
                <option value="scheduled">Bekleniyor</option>
                <option value="attended">Geldi</option>
                <option value="missed">Gelmedi</option>
                <option value="ertelendi">Ertelendi</option>
              </NativeSelect>
            </div>
          </div>

          {smsText && (
            <div className="space-y-2 rounded-md border bg-muted/40 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <MessageSquare className="size-3.5" />
                SMS Önizleme
              </p>
              <p className="text-sm">{smsText}</p>
            </div>
          )}

          <DialogFooter className="sm:justify-between">
            <Button variant="destructive" disabled={updating} onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-4" />
              Sil
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button variant="outline" disabled={updating} onClick={onClose}>
                Kapat
              </Button>
              <Button
                variant="outline"
                disabled={updating}
                onClick={() => {
                  if (!patient?.phone) return toast.error("Hastanın telefon numarası bulunamadı");
                  sendAppointmentSms(patient.patient_id, patient.phone, smsText);
                }}
              >
                SMS Gönder
              </Button>
              <Button disabled={updating} onClick={update}>
                {updating ? "Güncelleniyor…" : "Güncelle"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Randevu silinsin mi?</DialogTitle>
            <DialogDescription>Bu randevuyu silmek istediğinize emin misiniz?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Vazgeç
            </Button>
            <Button variant="destructive" onClick={remove}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
