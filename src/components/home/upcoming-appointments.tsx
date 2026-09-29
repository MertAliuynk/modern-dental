"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { API } from "@/lib/api";
import { doctorColor } from "@/lib/appointments";

type Doctor = { user_id: number; first_name: string; last_name: string; branch_id: number };

type Appointment = {
  appointment_id: number;
  patient_id: number;
  doctor_id: number;
  appointment_time: string;
  status: string;
  notes: string;
  patient_first_name: string;
  patient_last_name: string;
  patient_name?: string;
};

type ApprovedTreatment = { treatment_id: number; treatment_type_name: string; tooth_numbers: number[] };

function formatTime(date: string) {
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

function WhenText({ startsAt }: { startsAt: string }) {
  const m = Math.round((new Date(startsAt).getTime() - Date.now()) / 60000);
  if (m < -5) return <span className="font-medium text-amber-600 dark:text-amber-400">{Math.abs(m)} dk gecikti</span>;
  if (m <= 5) return <span className="font-medium text-emerald-600 dark:text-emerald-400">Şimdi</span>;
  if (m < 60) return <span>{m} dk sonra</span>;
  return (
    <span>
      {Math.floor(m / 60)} sa {m % 60 ? `${m % 60} dk` : ""} sonra
    </span>
  );
}

function patientName(a: Appointment) {
  return a.patient_first_name || a.patient_last_name
    ? `${a.patient_first_name || ""} ${a.patient_last_name || ""}`.trim()
    : a.patient_name || "Bilinmiyor";
}

function AppointmentCard({
  doctor,
  appointment,
  remainingAfter,
  onStatusUpdate,
}: {
  doctor: Doctor;
  appointment: Appointment | null;
  remainingAfter: number;
  onStatusUpdate: (appointmentId: number, status: "geldi" | "gelmedi", notes: string, completedTreatmentId?: number) => Promise<void>;
}) {
  const [availableTreatments, setAvailableTreatments] = useState<ApprovedTreatment[]>([]);
  const [selectedTreatment, setSelectedTreatment] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const color = doctorColor(doctor.user_id);
  const patientId = appointment?.patient_id;

  // Hasta değiştiğinde onaylanan tedavileri getir
  useEffect(() => {
    if (!patientId) {
      setAvailableTreatments([]);
      return;
    }
    fetch(`${API}/treatment/patient/${patientId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
        setAvailableTreatments(
          data.data
            .filter((t: { status: string }) => t.status === "onaylanan")
            .map((t: { treatment_id: number; treatment_name?: string; treatment_type_name?: string; tooth_numbers?: number[] }) => ({
              treatment_id: t.treatment_id,
              treatment_type_name: t.treatment_name || t.treatment_type_name || "Bilinmeyen Tedavi",
              tooth_numbers: t.tooth_numbers || [],
            })),
        );
      })
      .catch(() => setAvailableTreatments([]));
  }, [patientId]);

  const handleStatusClick = async (status: "geldi" | "gelmedi") => {
    if (!appointment) return;
    if (!notes.trim()) {
      toast.error("Not yazması zorunludur!");
      return;
    }
    if (status === "gelmedi" && selectedTreatment) {
      toast.error("Biten tedavi seçiliyken 'Gelmedi' seçilemez!");
      return;
    }
    setIsLoading(true);
    await onStatusUpdate(appointment.appointment_id, status, notes.trim(), status === "geldi" && selectedTreatment ? selectedTreatment : undefined);
    setIsLoading(false);
    setNotes("");
    setSelectedTreatment(null);
  };

  const header = (
    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <span className="truncate">
        Dt. {doctor.first_name} {doctor.last_name}
      </span>
    </p>
  );

  if (!appointment) {
    return (
      <div className="flex flex-col gap-3 rounded-md border border-dashed p-3.5">
        {header}
        <p className="py-6 text-center text-sm text-muted-foreground">Sıradaki randevu yok</p>
      </div>
    );
  }

  return (
    <div className="appt appt-upcoming flex flex-col gap-3 p-3.5" style={{ "--appt-color": color } as React.CSSProperties}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {header}
          <Link href={`/patients/card?id=${appointment.patient_id}`} target="_blank" className="mt-1 block truncate text-base font-semibold hover:underline">
            {patientName(appointment)}
          </Link>
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
            <Clock className="size-3.5" />
            {formatTime(appointment.appointment_time)} · <WhenText startsAt={appointment.appointment_time} />
          </p>
        </div>
        {remainingAfter > 0 && (
          <span className="shrink-0 rounded-full bg-background/70 px-2 py-0.5 text-[11px] text-muted-foreground">sonra {remainingAfter} hasta</span>
        )}
      </div>

      <NativeSelect
        className="bg-background rounded-lg"
        value={selectedTreatment ?? ""}
        onChange={(e) => setSelectedTreatment(e.target.value ? parseInt(e.target.value) : null)}
      >
        <option value="">Biten tedavi (isteğe bağlı)</option>
        {availableTreatments.map((t) => (
          <option key={t.treatment_id} value={t.treatment_id}>
            {t.treatment_type_name}
            {t.tooth_numbers.length > 0 && ` (Dişler: ${t.tooth_numbers.join(", ")})`}
          </option>
        ))}
      </NativeSelect>

      <Input
        className="bg-background"
        placeholder="Not (zorunlu)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        aria-invalid={notes.length > 0 && !notes.trim()}
      />

      <div className="grid grid-cols-2 gap-1.5">
        <Button size="sm" disabled={isLoading || !notes.trim()} onClick={() => handleStatusClick("geldi")}>
          {isLoading ? "Kaydediliyor…" : "Geldi"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="bg-background"
          disabled={isLoading || !notes.trim() || !!selectedTreatment}
          onClick={() => handleStatusClick("gelmedi")}
        >
          {isLoading ? "Kaydediliyor…" : "Gelmedi"}
        </Button>
      </div>
    </div>
  );
}

export function UpcomingAppointments({ role, userId }: { role: string; userId: number | null }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<number>(0);

  // Yönetici/şube müdürü/bankocu seçili şubeyi, diğerleri kendi şubesini kullanır.
  useEffect(() => {
    const branchId = parseInt(localStorage.getItem("branchId") || "1");
    let active = branchId;
    if (role === "admin" || role === "branch_manager" || role === "receptionist") {
      const selected = localStorage.getItem("selectedBranchId");
      if (selected) active = parseInt(selected);
    }
    setSelectedBranchId(active);
  }, [role]);

  const fetchDoctors = useCallback(async (branchId: number) => {
    try {
      const res = await fetch(`${API}/branch/${branchId}/doctors`);
      const data = await res.json();
      setDoctors(data.success && data.data ? data.data : []);
    } catch {
      setDoctors([]);
    }
  }, []);

  const fetchAppointments = useCallback(async (branchId: number) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`${API}/appointment?branch_id=${branchId}&start_date=${today}&end_date=${today}`);
      const data = await res.json();
      if (data.success && data.data) {
        setAppointments(
          data.data
            .filter((a: Appointment) => a.status === "scheduled")
            .sort((a: Appointment, b: Appointment) => new Date(a.appointment_time).getTime() - new Date(b.appointment_time).getTime()),
        );
      } else {
        setAppointments([]);
      }
    } catch {
      setAppointments([]);
    }
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    fetchDoctors(selectedBranchId);
    fetchAppointments(selectedBranchId);
  }, [selectedBranchId, fetchDoctors, fetchAppointments]);

  const handleStatusUpdate = async (appointmentId: number, status: "geldi" | "gelmedi", notes: string, completedTreatmentId?: number) => {
    try {
      const updateResponse = await fetch(`${API}/appointment/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: status === "geldi" ? "attended" : "missed", notes }),
      });
      const updateResult = await updateResponse.json();
      if (!updateResult.success) {
        toast.error("Randevu güncellenirken hata oluştu");
        return;
      }
      if (status === "geldi" && completedTreatmentId) {
        const treatmentResponse = await fetch(`${API}/treatment/${completedTreatmentId}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "tamamlanan" }),
        });
        const treatmentResult = await treatmentResponse.json();
        if (!treatmentResult.success) {
          toast.error("Tedavi durumu güncellenirken hata oluştu");
          return;
        }
      }
      toast.success(`Randevu başarıyla ${status === "geldi" ? "tamamlandı" : "kaçırıldı olarak işaretlendi"}!`);
      fetchAppointments(selectedBranchId);
    } catch {
      toast.error("Güncelleme sırasında hata oluştu");
    }
  };

  const visibleDoctors = role === "doctor" ? doctors.filter((d) => d.user_id === userId) : doctors;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sıradaki Randevular</CardTitle>
        <CardDescription>Bugün her hekimin sıradaki randevusu. Durum işaretlemek için not yazmak zorunludur.</CardDescription>
      </CardHeader>
      <CardContent>
        {visibleDoctors.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {role === "doctor" ? "Doktor bilgisi bulunamadı." : "Bu şubede doktor bulunamadı."}
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visibleDoctors.map((doctor) => {
              const mine = appointments.filter((a) => String(a.doctor_id) === String(doctor.user_id));
              return (
                <AppointmentCard
                  key={doctor.user_id}
                  doctor={doctor}
                  appointment={mine[0] ?? null}
                  remainingAfter={Math.max(0, mine.length - 1)}
                  onStatusUpdate={handleStatusUpdate}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
