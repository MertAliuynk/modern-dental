"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarPlus, ChevronDown, FileDown, FileSignature, Pencil, Plus, Printer, StickyNote, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { API } from "@/lib/api";
import {
  formatTRY,
  jawLabel,
  lineTotal,
  loadPriceMap,
  STATUS_LABEL,
  teethOf,
  treatmentDateLabel,
  type PriceMap,
  type Treatment,
  type TreatmentType,
} from "@/lib/treatments";
import { downloadTreatmentPdf } from "@/lib/treatment-pdf";

type Patient = {
  patient_id: number;
  first_name: string;
  last_name: string;
  tc_number?: string;
  phone?: string;
  birth_date?: string;
  notes?: string;
};
type Anamnesis = { question: string; answer_text?: string; answer_boolean?: boolean };
type Appointment = {
  appointment_id: number;
  appointment_time: string;
  status?: string;
  status_tr?: string;
  notes?: string;
  doctor_first_name?: string;
  doctor_last_name?: string;
  doctor_name?: string;
};
type PatientNote = { note_id: number; note: string; created_at: string };

const APPT_STATUS_CLASS: Record<string, string> = {
  Gelmedi: "border-l-destructive bg-destructive/5",
  Geldi: "border-l-emerald-500 bg-emerald-500/5",
  Planlandı: "border-l-blue-500 bg-blue-500/5",
  İptal: "border-l-muted-foreground bg-muted",
};

const dateOnly = (s: string) => new Date(s).toLocaleDateString("tr-TR");

async function putStatus(ids: number[], status: string) {
  const results = await Promise.all(
    ids.map((id) =>
      fetch(`${API}/treatment/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).then((r) => r.json()),
    ),
  );
  return results.every((r) => r.success);
}

function TreatmentRow({
  tr,
  typeName,
  selectable,
  selected,
  onToggle,
  total,
  showStatusBadge,
  teethOnly = false,
}: {
  tr: Treatment;
  typeName: string;
  selectable: boolean;
  selected: boolean;
  onToggle: () => void;
  total: number | null;
  showStatusBadge: boolean;
  /** Biten tedavilerde eski sitedeki gibi çene yerine yalnızca diş numaraları gösterilir. */
  teethOnly?: boolean;
}) {
  const teeth = teethOf(tr);
  const jaw = teethOnly ? "" : jawLabel(tr);
  const showTeethOnly = teethOnly ? teeth.length > 0 : !!tr.is_per_tooth && teeth.length > 0;
  const dateText = treatmentDateLabel(tr);
  const statusTone =
    tr.status === "onaylanan"
      ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
      : tr.status === "tamamlanan"
        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        : "bg-muted text-muted-foreground";
  return (
    <div
      role={selectable ? "button" : undefined}
      tabIndex={selectable ? 0 : undefined}
      onClick={selectable ? onToggle : undefined}
      onKeyDown={selectable ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onToggle()) : undefined}
      className={`flex gap-2 rounded-md border p-2 text-xs transition-colors ${
        selected ? "border-primary bg-accent" : selectable ? "border-border hover:bg-accent/60" : "border-border bg-muted/40"
      } ${selectable ? "cursor-pointer" : ""}`}
    >
      {selectable && <Checkbox className="mt-0.5 print:hidden" checked={selected} onCheckedChange={onToggle} onClick={(e) => e.stopPropagation()} />}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground">
          {typeName}
          {(jaw || showTeethOnly) && (
            <span className="font-normal text-muted-foreground">
              {" "}
              · {jaw ? `${jaw}${teeth.length > 0 ? ` (${teeth.join(", ")})` : ""}` : `Dişler: ${teeth.join(", ")}`}
            </span>
          )}
        </p>
        <p className="text-muted-foreground">
          {[tr.doctor_name, dateText].filter(Boolean).join(" · ")}
        </p>
        {showStatusBadge && tr.status !== "önerilen" && (
          <span className={`mt-1 inline-block rounded-full px-1.5 py-px text-[10px] font-medium ${statusTone}`}>{STATUS_LABEL[tr.status] ?? tr.status}</span>
        )}
      </div>
      {total != null && <span className="shrink-0 font-medium tabular-nums">{formatTRY(total)}</span>}
    </div>
  );
}

function TreatmentColumn({
  title,
  subtitle,
  count,
  children,
  footer,
}: {
  title: string;
  subtitle?: string | null;
  count: number;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className="flex min-w-0 flex-col">
      <CardHeader className="space-y-0.5">
        <CardTitle className="text-sm">
          {title} <span className="font-normal text-muted-foreground">({count})</span>
        </CardTitle>
        {subtitle && <CardDescription className="text-xs">{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent className="max-h-128 flex-1 space-y-2 overflow-y-auto print:max-h-none print:overflow-visible">{children}</CardContent>
      {footer && <div className="border-t p-3 print:hidden">{footer}</div>}
    </Card>
  );
}

export function PatientCardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");

  const [patient, setPatient] = useState<Patient | null>(null);
  const [anamnesis, setAnamnesis] = useState<Anamnesis[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorNames, setDoctorNames] = useState<string[]>([]);
  const [patientNotes, setPatientNotes] = useState<PatientNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [anamnesisOpen, setAnamnesisOpen] = useState(false);

  const [selectedSuggested, setSelectedSuggested] = useState<number[]>([]);
  const [selectedApproved, setSelectedApproved] = useState<number[]>([]);
  const [selectedCompleted, setSelectedCompleted] = useState<number[]>([]);
  const [busy, setBusy] = useState<"approve" | "complete" | null>(null);
  const [confirm, setConfirm] = useState<{ text: string; run: () => Promise<void> } | null>(null);

  const [printOpen, setPrintOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [addNoteValue, setAddNoteValue] = useState("");

  const [role, setRole] = useState("");
  const [branchId, setBranchId] = useState(1);
  const [priceMap, setPriceMap] = useState<PriceMap>({});

  useEffect(() => {
    if (!patientId) return;
    try {
      setRole(localStorage.getItem("role") || "");
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        const b = u?.branchId || u?.branch_id;
        if (b) setBranchId(Number(b));
      }
    } catch {}
    setLoading(true);
    Promise.all([
      fetch(`${API}/patient/${patientId}`).then((r) => r.json()),
      fetch(`${API}/treatment/patient/${patientId}`).then((r) => r.json()),
      fetch(`${API}/patient-anamnesis/${patientId}`).then((r) => r.json()),
      fetch(`${API}/treatment-type`).then((r) => r.json()),
      fetch(`${API}/appointment?patient_id=${patientId}`).then((r) => r.json()),
      fetch(`${API}/patient/all-doctors-relations`).then((r) => r.json()),
      fetch(`${API}/user?role=doctor`).then((r) => r.json()),
      fetch(`${API}/patient-notes/patient/${patientId}`).then((r) => r.json()),
    ])
      .then(([p, t, a, tt, ap, rel, docList, notesRes]) => {
        if (!p.success) throw new Error("Hasta bulunamadı");
        setPatient(p.data);
        setTreatments(t.success && t.data ? t.data : []);
        setAnamnesis(a.success && a.data ? a.data : []);
        setTreatmentTypes(tt.success && tt.data ? tt.data : []);
        setAppointments(ap.success && ap.data ? ap.data : []);
        let names: string[] = [];
        if (rel.success && Array.isArray(rel.data) && docList.success && Array.isArray(docList.data)) {
          const ids = rel.data.filter((r: { patient_id: number }) => String(r.patient_id) === String(patientId)).map((r: { doctor_id: number }) => r.doctor_id);
          names = docList.data
            .filter((d: { user_id: number }) => ids.includes(d.user_id))
            .map((d: { first_name: string; last_name: string }) => d.first_name + " " + d.last_name);
        }
        setDoctorNames(names);
        setPatientNotes(
          notesRes.success && Array.isArray(notesRes.data)
            ? [...notesRes.data].sort((x: PatientNote, y: PatientNote) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime())
            : [],
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Veriler alınamadı");
        setLoading(false);
      });
  }, [patientId]);

  useEffect(() => {
    let cancelled = false;
    loadPriceMap(branchId, treatmentTypes).then((m) => !cancelled && setPriceMap(m));
    return () => {
      cancelled = true;
    };
  }, [branchId, treatmentTypes]);

  const refreshTreatments = useCallback(async () => {
    const res = await fetch(`${API}/treatment/patient/${patientId}`);
    const data = await res.json();
    if (data.success) setTreatments(data.data);
  }, [patientId]);

  const suggested = treatments.filter((t) => t.status === "önerilen");
  const approved = treatments.filter((t) => t.status === "onaylanan");
  const completed = treatments.filter((t) => t.status === "tamamlanan");
  const showTotals = role === "admin";
  const typeName = (tr: Treatment) => treatmentTypes.find((tt) => tt.treatment_type_id === tr.treatment_type_id)?.name ?? "Bilinmeyen Tedavi";
  const suggestedTotal = suggested.reduce((s, tr) => s + lineTotal(tr, priceMap), 0);

  const toggle = (setter: React.Dispatch<React.SetStateAction<number[]>>) => (id: number) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const lastDate = (items: Treatment[], key: "suggested_at" | "approved_at" | "completed_at") =>
    items.length > 0 ? dateOnly(new Date(Math.max(...items.map((t) => new Date(t[key] || t.created_at || 0).getTime()))).toISOString()) : null;

  const approveSelected = async () => {
    setBusy("approve");
    try {
      if (await putStatus(selectedSuggested, "onaylanan")) {
        await refreshTreatments();
        setSelectedSuggested([]);
      } else toast.error("Bazı tedaviler onaylanamadı. Lütfen tekrar deneyin.");
    } catch {
      toast.error("Tedaviler onaylanırken hata oluştu");
    } finally {
      setBusy(null);
    }
  };

  const completeSelected = async () => {
    setBusy("complete");
    try {
      if (await putStatus(selectedApproved, "tamamlanan")) {
        await refreshTreatments();
        setSelectedApproved([]);
      } else toast.error("Bazı tedaviler tamamlanamadı. Lütfen tekrar deneyin.");
    } catch {
      toast.error("Tedaviler tamamlanırken hata oluştu");
    } finally {
      setBusy(null);
    }
  };

  const deleteSuggested = () =>
    setConfirm({
      text: `${selectedSuggested.length} tedavi silinecek. Emin misiniz?`,
      run: async () => {
        try {
          const results = await Promise.all(
            selectedSuggested.map((id) =>
              fetch(`${API}/treatment/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json" } }).then((r) => r.json()),
            ),
          );
          if (results.every((r) => r.success)) {
            await refreshTreatments();
            setSelectedSuggested([]);
          } else toast.error("Bazı tedaviler silinemedi. Lütfen tekrar deneyin.");
        } catch {
          toast.error("Tedaviler silinirken hata oluştu");
        }
      },
    });

  const undoApproved = () =>
    setConfirm({
      text: `${selectedApproved.length} tedavi önerilen olarak geri alınacak. Emin misiniz?`,
      run: async () => {
        try {
          if (await putStatus(selectedApproved, "önerilen")) {
            await refreshTreatments();
            setSelectedApproved([]);
          } else toast.error("Bazı tedaviler geri alınamadı. Lütfen tekrar deneyin.");
        } catch {
          toast.error("Tedaviler geri alınırken hata oluştu");
        }
      },
    });

  const undoCompleted = () =>
    setConfirm({
      text: `${selectedCompleted.length} tedavi onaylanan olarak geri alınacak. Emin misiniz?`,
      run: async () => {
        try {
          if (await putStatus(selectedCompleted, "onaylanan")) {
            await refreshTreatments();
            setSelectedCompleted([]);
          } else toast.error("Bazı tedaviler geri alınamadı. Lütfen tekrar deneyin.");
        } catch {
          toast.error("Tedaviler geri alınırken hata oluştu");
        }
      },
    });

  const saveNote = async () => {
    if (!patient) return;
    if (!addNoteValue.trim()) {
      toast.error("Not boş olamaz!");
      return;
    }
    try {
      const res = await fetch(`${API}/patient-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patient.patient_id, note: addNoteValue }),
      });
      const data = await res.json();
      if (data.success) {
        setAddNoteOpen(false);
        setAddNoteValue("");
        setPatientNotes((prev) => [{ ...data.data }, ...prev]);
      } else toast.error(data.message || "Ekleme başarısız!");
    } catch {
      toast.error("Sunucu hatası!");
    }
  };

  if (!patientId) {
    return <p className="py-24 text-center text-sm text-muted-foreground">Hasta seçilmedi. Üstteki &quot;Hasta Kartı&quot; düğmesinden bir hasta seçin.</p>;
  }
  if (loading) return <p className="py-24 text-center text-sm text-muted-foreground">Yükleniyor…</p>;
  if (error) return <p className="py-24 text-center text-sm text-destructive">{error}</p>;
  if (!patient) return null;

  const isDoctor = role === "doctor";
  const sortedAppointments = appointments.slice().sort((a, b) => new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime());

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <div className="flex flex-wrap justify-center gap-2 print:hidden">
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/patients/card/treatment-add-page?id=${patientId}`} />}>
          <Plus className="size-4" />
          Tedavi Ekle
        </Button>
        <Button size="sm" variant="outline" onClick={() => router.push("/calendar")}>
          <CalendarPlus className="size-4" />
          Yeni Randevu
        </Button>
        <Button size="sm" variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          Yazdır
        </Button>
        <Button size="sm" variant="outline" onClick={() => setPrintOpen(true)}>
          <FileDown className="size-4" />
          PDF İndir
        </Button>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href={`/patients/consent?patientId=${patientId}`} />}>
          <FileSignature className="size-4" />
          Onam Formu
        </Button>
        <Button size="sm" variant="outline" onClick={() => setAddNoteOpen(true)}>
          <StickyNote className="size-4" />
          Not Ekle
        </Button>
        <Button size="sm" variant="outline" onClick={() => router.push(`/patients/new?id=${patient.patient_id}`)}>
          <Pencil className="size-4" />
          Düzenle
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="size-4 text-muted-foreground" />
              {patient.first_name} {patient.last_name}
            </CardTitle>
            <CardDescription>İlgili doktor(lar): {doctorNames.length > 0 ? doctorNames.join(", ") : "-"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p>
              <span className="text-muted-foreground">TC No:</span> {isDoctor ? "•••" : patient.tc_number || "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Tel:</span> {isDoctor ? "•••" : patient.phone || "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Doğum Tarihi:</span> {patient.birth_date ? patient.birth_date.slice(0, 10) : "-"}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setAnamnesisOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-md py-1 text-left text-sm font-medium hover:text-foreground"
              >
                Anamnez
                <ChevronDown className={`size-4 text-muted-foreground transition-transform ${anamnesisOpen ? "rotate-180" : ""}`} />
              </button>
              {anamnesisOpen && (
                <ul className="mt-1 max-h-48 list-inside list-disc space-y-1 overflow-y-auto rounded-md border bg-muted/40 p-2.5 text-xs text-muted-foreground">
                  {anamnesis.length === 0 ? (
                    <li>Yok</li>
                  ) : (
                    anamnesis.map((a, i) => (
                      <li key={i}>
                        {a.question}: {a.answer_text || (a.answer_boolean ? "Evet" : "Hayır")}
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3 lg:col-span-3">
          {/* Önerilen: tüm tedaviler listelenir, yalnızca önerilenler seçilebilir */}
          <TreatmentColumn
            title="Önerilen Tedaviler"
            subtitle={lastDate(suggested, "suggested_at") && `Son önerilen: ${lastDate(suggested, "suggested_at")}`}
            count={suggested.length}
            footer={
              suggested.length > 0 && (
                <div className="flex flex-col gap-2">
                  {showTotals && (
                    <p className="flex justify-between text-sm font-medium">
                      <span>Toplam</span>
                      <span className="tabular-nums">{formatTRY(suggestedTotal)}</span>
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" disabled={selectedSuggested.length === 0 || busy === "approve"} onClick={approveSelected}>
                      {busy === "approve" ? "Onaylanıyor…" : `Onayla (${selectedSuggested.length})`}
                    </Button>
                    <Button size="sm" variant="destructive" disabled={selectedSuggested.length === 0} onClick={deleteSuggested}>
                      Sil ({selectedSuggested.length})
                    </Button>
                  </div>
                </div>
              )
            }
          >
            {treatments.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Yok</p>
            ) : (
              treatments
                .filter((x) => ["önerilen", "onaylanan", "tamamlanan"].includes(x.status))
                .sort((a, b) => Number(b.status === "önerilen") - Number(a.status === "önerilen"))
                .map((tr) => (
                  <TreatmentRow
                    key={tr.treatment_id}
                    tr={tr}
                    typeName={typeName(tr)}
                    selectable={tr.status === "önerilen"}
                    selected={selectedSuggested.includes(tr.treatment_id)}
                    onToggle={() => toggle(setSelectedSuggested)(tr.treatment_id)}
                    total={showTotals ? lineTotal(tr, priceMap) : null}
                    showStatusBadge
                  />
                ))
            )}
          </TreatmentColumn>

          <TreatmentColumn
            title="Onaylanan Tedaviler"
            subtitle={lastDate(approved, "approved_at") && `Son onaylanan: ${lastDate(approved, "approved_at")}`}
            count={approved.length}
            footer={
              approved.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" disabled={selectedApproved.length === 0 || busy === "complete"} onClick={completeSelected}>
                    {busy === "complete" ? "Tamamlanıyor…" : `Tamamla (${selectedApproved.length})`}
                  </Button>
                  <Button size="sm" variant="outline" disabled={selectedApproved.length === 0} onClick={undoApproved}>
                    Geri Al ({selectedApproved.length})
                  </Button>
                </div>
              )
            }
          >
            {approved.length + completed.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Yok</p>
            ) : (
              treatments
                .filter((x) => ["onaylanan", "tamamlanan"].includes(x.status))
                .sort((a, b) => Number(b.status === "onaylanan") - Number(a.status === "onaylanan"))
                .map((tr) => (
                  <TreatmentRow
                    key={tr.treatment_id}
                    tr={tr}
                    typeName={typeName(tr)}
                    selectable={tr.status === "onaylanan"}
                    selected={selectedApproved.includes(tr.treatment_id)}
                    onToggle={() => toggle(setSelectedApproved)(tr.treatment_id)}
                    total={showTotals ? lineTotal(tr, priceMap) : null}
                    showStatusBadge
                  />
                ))
            )}
          </TreatmentColumn>

          <TreatmentColumn
            title="Biten Tedaviler"
            subtitle={lastDate(completed, "completed_at") && `Son tamamlanan: ${lastDate(completed, "completed_at")}`}
            count={completed.length}
            footer={
              completed.length > 0 && (
                <Button size="sm" variant="outline" className="w-full" disabled={selectedCompleted.length === 0} onClick={undoCompleted}>
                  Geri Al ({selectedCompleted.length})
                </Button>
              )
            }
          >
            {completed.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Yok</p>
            ) : (
              completed.map((tr) => (
                <TreatmentRow
                  key={tr.treatment_id}
                  tr={tr}
                  teethOnly
                  typeName={typeName(tr)}
                  selectable
                  selected={selectedCompleted.includes(tr.treatment_id)}
                  onToggle={() => toggle(setSelectedCompleted)(tr.treatment_id)}
                  total={null}
                  showStatusBadge={false}
                />
              ))
            )}
          </TreatmentColumn>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="text-base">Hasta Notları</CardTitle>
            <CardDescription>
              Toplam {patientNotes.length} not
              {patientNotes.length > 0 && ` · Son güncelleme: ${dateOnly(patientNotes[0].created_at)}`}
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" className="print:hidden" onClick={() => setAddNoteOpen(true)}>
            <Plus className="size-3.5" />
            Not Ekle
          </Button>
        </CardHeader>
        <CardContent>
          {patientNotes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Henüz not eklenmemiş.</p>
          ) : (
            <div className="grid max-h-[600px] gap-3 overflow-y-auto sm:grid-cols-2 print:max-h-none print:overflow-visible">
              {patientNotes.map((note, index) => (
                <div key={note.note_id} className="rounded-md border border-l-4 border-l-primary/60 p-3 text-sm">
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      #{patientNotes.length - index} · {new Date(note.created_at).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
                    </span>
                    <span className="font-mono">{new Date(note.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words">{note.note}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Randevu Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedAppointments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Kayıt yok</p>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedAppointments.map((ap, idx, arr) => {
                const doctorName =
                  ap.doctor_first_name && ap.doctor_last_name ? `Dr. ${ap.doctor_first_name} ${ap.doctor_last_name}` : ap.doctor_name || "Doktor Bilgisi Yok";
                const statusText = ap.status_tr || (ap.status ? ap.status.charAt(0).toUpperCase() + ap.status.slice(1) : "");
                return (
                  <div key={ap.appointment_id} className={`rounded-md border border-l-4 px-3 py-2 text-sm ${APPT_STATUS_CLASS[ap.status_tr ?? ""] ?? ""}`}>
                    <p className="font-medium">
                      {arr.length - idx}. Seans · {new Date(ap.appointment_time).toLocaleString("tr-TR")} · {statusText}
                    </p>
                    <p className="text-xs text-muted-foreground">{doctorName}</p>
                    {ap.notes && <p className="mt-0.5 text-xs text-muted-foreground">Not: {ap.notes}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF onayı */}
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PDF Olarak Yazdır</DialogTitle>
            <DialogDescription>Hastaya önerilen, onaylanan ve tamamlanan tedaviler PDF olarak indirilecek. Onaylıyor musunuz?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintOpen(false)}>
              Vazgeç
            </Button>
            <Button
              onClick={async () => {
                setPrintOpen(false);
                await downloadTreatmentPdf({
                  patientName: `${patient.first_name || ""} ${patient.last_name || ""}`,
                  doctorNames,
                  suggested,
                  approved,
                  completed,
                });
              }}
            >
              Onayla ve İndir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Not ekleme */}
      <Dialog open={addNoteOpen} onOpenChange={setAddNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Not Ekle</DialogTitle>
          </DialogHeader>
          <Textarea rows={4} placeholder="Not giriniz…" value={addNoteValue} onChange={(e) => setAddNoteValue(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddNoteOpen(false)}>
              İptal
            </Button>
            <Button onClick={saveNote}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme / geri alma onayı */}
      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emin misiniz?</DialogTitle>
            <DialogDescription>{confirm?.text}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              Vazgeç
            </Button>
            <Button
              onClick={async () => {
                const c = confirm;
                setConfirm(null);
                await c?.run();
              }}
            >
              Onayla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
