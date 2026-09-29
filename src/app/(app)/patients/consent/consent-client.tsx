"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FileSignature, Printer, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ConsentFormPrintView, type ConsentBranch, type ConsentPatient } from "@/components/consent-form-print-view";
import { LEGACY_CONSENT_KEY, LEGACY_CONSENT_TITLE, LegacyConsentPrintView } from "@/components/legacy-consent-print-view";
import { CONSENT_FORM_CATEGORIES, CONSENT_FORM_TEMPLATES } from "@/lib/consent-form-templates";
import { API } from "@/lib/api";

type Patient = ConsentPatient & { patient_id: number; branch_id?: number };
type PatientRow = { patient_id: number; first_name: string; last_name: string; phone?: string; branch_name?: string };
type Doctor = { user_id: number; first_name: string; last_name: string; branch_id?: number };
type Branch = { branch_id: number; name: string; address?: string | null };

function PatientPicker({ patient, onSelect }: { patient: Patient | null; onSelect: (id: number | null) => void }) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<PatientRow[]>([]);

  useEffect(() => {
    if (!search.trim()) return setResults([]);
    const t = setTimeout(() => {
      const params = new URLSearchParams({ limit: "8", offset: "0", search: search.trim() });
      fetch(`${API}/patient?${params.toString()}`)
        .then((r) => r.json())
        .then((d) => setResults(d.success ? d.data : []))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  if (patient) {
    return (
      <div className="flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm">
        <div>
          <p className="font-medium">
            {patient.first_name} {patient.last_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {patient.phone}
            {patient.branch_name && ` · ${patient.branch_name}`}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onSelect(null)}>
          Değiştir
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Hasta ara…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-md border border-input">
          {results.map((p) => (
            <button
              key={p.patient_id}
              type="button"
              className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
              onClick={() => {
                onSelect(p.patient_id);
                setSearch("");
              }}
            >
              <span>
                {p.first_name} {p.last_name}
              </span>
              <span className="text-muted-foreground">{p.phone}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ConsentClient() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("patientId");
  const [patientId, setPatientId] = useState<number | null>(initialId ? Number(initialId) : null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [templateKey, setTemplateKey] = useState<string | null>(null);

  // Şubenin doktorları (eski sitedeki doktor seçimiyle aynı kaynak)
  useEffect(() => {
    const branchId = localStorage.getItem("branchId");
    fetch(`${API}/user/doctors`)
      .then((r) => r.json())
      .then((d) => setDoctors(d.success ? d.data.filter((x: Doctor) => !branchId || String(x.branch_id) === String(branchId)) : []))
      .catch(() => setDoctors([]));
    fetch(`${API}/branch`)
      .then((r) => r.json())
      .then((d) => d.success && setBranches(d.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!patientId) {
      setPatient(null);
      return;
    }
    fetch(`${API}/patient/${patientId}`)
      .then((r) => r.json())
      .then((d) => d.success && setPatient(d.data))
      .catch(() => {});
    // Hastanın ilgili doktorlarından ilki varsayılan hekim olur (hasta kartındaki kaynakla aynı)
    fetch(`${API}/patient/all-doctors-relations`)
      .then((r) => r.json())
      .then((d) => {
        const rel = d.success && Array.isArray(d.data) ? d.data.find((x: { patient_id: number }) => String(x.patient_id) === String(patientId)) : null;
        if (rel) setDoctorId(String(rel.doctor_id));
      })
      .catch(() => {});
  }, [patientId]);

  const doctor = doctors.find((d) => String(d.user_id) === doctorId);
  const doctorName = doctor ? `${doctor.first_name} ${doctor.last_name}` : "";
  const branch: ConsentBranch = branches.find((b) => b.branch_id === patient?.branch_id) ?? (patient?.branch_name ? { name: patient.branch_name } : null);
  // Tek hasta kaydında şube adı gelmiyor; formlarda görünsün diye şube listesinden eklenir.
  const printPatient = patient ? { ...patient, branch_name: patient.branch_name || branch?.name || "" } : null;
  const template = CONSENT_FORM_TEMPLATES.find((t) => t.key === templateKey);
  const isLegacy = templateKey === LEGACY_CONSENT_KEY;
  const ready = !!patient && !!templateKey;

  const chip = (key: string, title: string, summary?: string) => (
    <button
      key={key}
      type="button"
      title={summary}
      onClick={() => setTemplateKey(key)}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        templateKey === key ? "border-foreground bg-foreground text-background" : "border-input text-muted-foreground hover:text-foreground"
      }`}
    >
      {title}
    </button>
  );

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-base">Onam Formları</CardTitle>
          <CardDescription>Hasta seçin, uygulanacak tedaviye uygun onam formunu belirleyin; hastanın bilgileri forma otomatik eklenir.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Hasta</Label>
              <PatientPicker patient={printPatient} onSelect={setPatientId} />
            </div>
            <div className="space-y-2">
              <Label>Tedaviyi Uygulayacak Hekim</Label>
              <NativeSelect value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
                <option value="">Seçiniz</option>
                {doctors.map((d) => (
                  <option key={d.user_id} value={d.user_id}>
                    {d.first_name} {d.last_name}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Onam Formu Türü</Label>
            {CONSENT_FORM_CATEGORIES.map((category) => (
              <div key={category}>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">{category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {category === "Genel" && chip(LEGACY_CONSENT_KEY, LEGACY_CONSENT_TITLE, "Eski sitede kullanılan genel onam formu.")}
                  {CONSENT_FORM_TEMPLATES.filter((t) => t.category === category).map((t) => chip(t.key, t.title, t.summary))}
                </div>
              </div>
            ))}
          </div>

          <Button className="w-full" disabled={!ready} onClick={() => requestAnimationFrame(() => window.print())}>
            <Printer className="size-4" />
            Yazdır
          </Button>
        </CardContent>
      </Card>

      {printPatient && isLegacy ? (
        <LegacyConsentPrintView patient={printPatient} doctorName={doctorName} />
      ) : printPatient && template ? (
        <ConsentFormPrintView branch={branch} patient={printPatient} doctorName={doctorName} template={template} />
      ) : (
        <Card className="print:hidden">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
            <FileSignature className="size-8" />
            Önizlemeyi görmek için bir hasta ve onam formu türü seçin.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
