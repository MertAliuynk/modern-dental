"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import TeethSvg from "@/components/teeth/TeethSvg";
import MilkTeethSvg from "@/components/teeth/MilkTeethSvg";
import { API } from "@/lib/api";
import { formatTRY, jawsOf, loadPriceMap, type PriceMap, type TreatmentType } from "@/lib/treatments";

type Patient = { patient_id: number; first_name: string; last_name: string; tc_number?: string; phone?: string; doctor_id?: number };
type Doctor = { user_id: number; first_name: string; last_name: string };
type PendingItem = {
  treatmentTypeId: number;
  treatmentName: string;
  toothNumbers: number[];
  isUpperJaw: boolean;
  isLowerJaw: boolean;
  notes?: string;
  doctorId: number;
};

const UPPER = { sürekli: [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], süt: [55, 54, 53, 52, 51, 61, 62, 63, 64, 65] };
const LOWER = { sürekli: [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38], süt: [75, 74, 73, 72, 71, 81, 82, 83, 84, 85] };

const parseToothNumbers = (ids: string[]): number[] =>
  ids
    .map((t) => {
      if (/^\d+$/.test(t)) return parseInt(t, 10);
      const m = t.match(/Tooth(\d+)_/);
      if (m) return parseInt(m[1]);
      const m2 = t.match(/milk-tooth-(\d+)/);
      return m2 ? parseInt(m2[1]) : 0;
    })
    .filter((n) => n > 0);

function pendingLineTotal(it: PendingItem, priceMap: PriceMap) {
  const pm = priceMap[it.treatmentTypeId];
  if (!pm) return 0;
  if (pm.isJawSpecific) {
    const { hasUpper, hasLower } = jawsOf({ treatment_id: 0, treatment_type_id: it.treatmentTypeId, status: "", tooth_numbers: it.toothNumbers, isUpperJaw: it.isUpperJaw, isLowerJaw: it.isLowerJaw });
    let total = 0;
    if (hasUpper) total += pm.upper || pm.base;
    if (hasLower) total += pm.lower || pm.base;
    if (!hasUpper && !hasLower) total += pm.base;
    return total;
  }
  return pm.base * (pm.isPerTooth ? it.toothNumbers?.length || 1 : 1);
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button type="button" size="sm" variant={active ? "default" : "outline"} onClick={onClick}>
      {children}
    </Button>
  );
}

function TreatmentAddClient() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [patient, setPatient] = useState<Patient | null>(null);
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTreatment, setSelectedTreatment] = useState<TreatmentType | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [selectedTeeth, setSelectedTeeth] = useState<string[]>([]);
  const [toothType, setToothType] = useState<"sürekli" | "süt">("sürekli");
  const [isUpperJawSelected, setIsUpperJawSelected] = useState(false);
  const [isLowerJawSelected, setIsLowerJawSelected] = useState(false);
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [role, setRole] = useState("");
  const [branchId, setBranchId] = useState(1);
  const [priceMap, setPriceMap] = useState<PriceMap>({});
  // Listeye ekledikten sonra SVG'deki seçimleri sıfırlamak için
  const [svgResetKey, setSvgResetKey] = useState(0);

  const categories = useMemo(() => Array.from(new Set(treatmentTypes.map((t) => t.category).filter(Boolean))) as string[], [treatmentTypes]);
  const filteredTreatments = useMemo(
    () => (selectedCategory ? treatmentTypes.filter((t) => t.category === selectedCategory) : treatmentTypes),
    [treatmentTypes, selectedCategory],
  );

  useEffect(() => {
    const init = async () => {
      try {
        setRole(localStorage.getItem("role") || "");
        const getB = (o: Record<string, unknown> | null) => (o?.branchId || o?.branch_id || o?.branchID) as number | undefined;
        const parse = (s: string | null) => {
          try {
            return s ? JSON.parse(s) : null;
          } catch {
            return null;
          }
        };
        const b = getB(parse(localStorage.getItem("user"))) || 1;
        setBranchId(b);

        const res = await fetch(`${API}/branch/${b}/doctors`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setDoctors(data.data);
          if (data.data.length > 0) setSelectedDoctorId(data.data[0].user_id);
        }

        const [pRes, ttRes] = await Promise.all([patientId ? fetch(`${API}/patient/${patientId}`) : Promise.resolve(null), fetch(`${API}/treatment-type`)]);
        if (pRes) {
          const pj = await pRes.json();
          if (pj?.success) setPatient(pj.data);
        }
        const tj = await ttRes.json();
        if (tj?.success) setTreatmentTypes(tj.data || []);
      } catch {
        setError("Veriler yüklenemedi");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [patientId]);

  useEffect(() => {
    let cancelled = false;
    loadPriceMap(branchId, treatmentTypes).then((m) => !cancelled && setPriceMap(m));
    return () => {
      cancelled = true;
    };
  }, [branchId, treatmentTypes]);

  const toggleJaw = (jaw: "upper" | "lower") => {
    const numbers = (jaw === "upper" ? UPPER : LOWER)[toothType].map(String);
    const isOn = jaw === "upper" ? isUpperJawSelected : isLowerJawSelected;
    (jaw === "upper" ? setIsUpperJawSelected : setIsLowerJawSelected)(!isOn);
    setSelectedTeeth((prev) => (isOn ? prev.filter((t) => !numbers.includes(t)) : Array.from(new Set([...prev, ...numbers]))));
  };

  const handleAddToList = () => {
    if (!selectedTreatment) return toast.error("Lütfen bir tedavi seçin");
    if (selectedTreatment.is_per_tooth && selectedTeeth.length === 0) return toast.error("Lütfen tedavi yapılacak dişleri seçin");
    if (!selectedDoctorId) return toast.error("Lütfen bir doktor seçin");
    setPending((p) => [
      ...p,
      {
        treatmentTypeId: selectedTreatment.treatment_type_id,
        treatmentName: selectedTreatment.name,
        toothNumbers: parseToothNumbers(selectedTeeth),
        isUpperJaw: isUpperJawSelected,
        isLowerJaw: isLowerJawSelected,
        notes,
        doctorId: selectedDoctorId,
      },
    ]);
    setSelectedTreatment(null);
    setSelectedTeeth([]);
    setIsUpperJawSelected(false);
    setIsLowerJawSelected(false);
    setNotes("");
    setSvgResetKey((k) => k + 1);
  };

  const handleSuggestAll = async () => {
    if (!patient) return toast.error("Hasta bulunamadı");
    if (pending.length === 0) return toast.error("Lütfen en az bir tedavi ekleyin");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : null;
      for (const it of pending) {
        const body = {
          patientId: patient.patient_id,
          treatmentTypeId: it.treatmentTypeId,
          doctorId: it.doctorId || user?.user_id || patient?.doctor_id,
          status: "önerilen",
          toothCount: it.toothNumbers?.length || 1,
          toothNumbers: it.toothNumbers,
          isLowerJaw: it.isLowerJaw,
          isUpperJaw: it.isUpperJaw,
          notes: it.notes || "",
        };
        const res = await fetch(`${API}/treatment`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(body),
        });
        const j = await res.json();
        if (!res.ok || !j?.success) throw new Error(j?.message || "Hata");
      }
      setPending([]);
      window.location.href = `/patients/card?id=${patient.patient_id}`;
    } catch (e) {
      toast.error((e as Error)?.message || "Tedavi önerilirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const showTotals = role === "admin";
  const overallTotal = pending.reduce((s, it) => s + pendingLineTotal(it, priceMap), 0);
  const canAdd = !!selectedTreatment && !(selectedTreatment.is_per_tooth && selectedTeeth.length === 0);
  const svgProps = {
    onSelect: (ids: string[]) => setSelectedTeeth(ids),
    onIndividualSelect: () => {
      setIsUpperJawSelected(false);
      setIsLowerJawSelected(false);
    },
    selectedTeeth,
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {patientId && (
            <Button variant="ghost" size="icon" aria-label="Hasta kartına dön" nativeButton={false} render={<Link href={`/patients/card?id=${patientId}`} />}>
              <ArrowLeft className="size-4" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold">Tedavi Ekle</h1>
            {patient && (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <UserRound className="size-3.5" />
                {patient.first_name} {patient.last_name} · TC: {patient.tc_number || "-"} · Tel: {patient.phone || "-"}
              </p>
            )}
          </div>
        </div>
        <div className="flex w-full items-center gap-2 sm:w-72">
          <Label htmlFor="doctor-select" className="shrink-0">
            Doktor
          </Label>
          <NativeSelect id="doctor-select" value={selectedDoctorId ?? ""} onChange={(e) => setSelectedDoctorId(Number(e.target.value))}>
            {doctors.map((d) => (
              <option key={d.user_id} value={d.user_id}>
                Dt. {d.first_name} {d.last_name}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tedavi Seçimi</CardTitle>
            <CardDescription>Kategori ve tedaviyi seçip listeye ekleyin.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>Kategori</Label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <Chip key={cat} active={selectedCategory === cat} onClick={() => setSelectedCategory(cat === selectedCategory ? "" : cat)}>
                      {cat}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Tedavi</Label>
              <div className="flex max-h-72 flex-col gap-1 overflow-y-auto rounded-md border p-1">
                {filteredTreatments.map((t) => {
                  const active = selectedTreatment?.treatment_type_id === t.treatment_type_id;
                  return (
                    <button
                      key={t.treatment_type_id}
                      type="button"
                      onClick={() => setSelectedTreatment(t)}
                      className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                        active ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                      }`}
                    >
                      <span className="truncate">{t.name}</span>
                      <span className={`shrink-0 text-[11px] ${active ? "opacity-80" : "text-muted-foreground"}`}>
                        {t.is_per_tooth ? "Diş bazlı" : t.is_jaw_specific ? "Çene bazlı" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Not (opsiyonel)</Label>
              <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tedavi ile ilgili notlar…" />
            </div>
            <Button onClick={handleAddToList} disabled={!canAdd}>
              <Plus className="size-4" />
              Listeye Ekle
            </Button>
          </CardContent>
        </Card>

        <Card className="min-w-0 lg:col-span-3">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-base">Diş Seçimi</CardTitle>
            <div className="flex flex-wrap gap-1.5">
              <Chip active={isUpperJawSelected} onClick={() => toggleJaw("upper")}>
                Üst Çene
              </Chip>
              <Chip active={isLowerJawSelected} onClick={() => toggleJaw("lower")}>
                Alt Çene
              </Chip>
              <span className="mx-1 w-px bg-border" />
              <Chip active={toothType === "sürekli"} onClick={() => setToothType("sürekli")}>
                Sürekli Dişler
              </Chip>
              <Chip active={toothType === "süt"} onClick={() => setToothType("süt")}>
                Süt Dişleri
              </Chip>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* SVG'ler açık zemine göre çizildiği için koyu temada da açık zemin korunur */}
            <div className="min-h-80 rounded-lg border bg-[#f2f2f2] p-2.5">
              {toothType === "sürekli" ? (
                <TeethSvg key={`svg-${toothType}-${svgResetKey}`} {...svgProps} />
              ) : (
                <MilkTeethSvg key={`svg-${toothType}-${svgResetKey}`} {...svgProps} />
              )}
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">Seçili Dişler:</span>{" "}
              {selectedTeeth.length === 0
                ? "Yok"
                : selectedTeeth
                    .map((id) => {
                      const match = id.match(/(\d{2})$/);
                      return match ? match[1] : id;
                    })
                    .join(", ")}
            </p>
          </CardContent>
        </Card>
      </div>

      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eklenen Tedaviler ({pending.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {pending.map((it, idx) => {
              const pm = priceMap[it.treatmentTypeId];
              return (
                <div key={idx} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-medium">{it.treatmentName}</span>
                    {it.toothNumbers?.length > 0 && <span className="text-muted-foreground">Dişler: {it.toothNumbers.join(", ")}</span>}
                    {it.isUpperJaw && <span className="rounded-full bg-muted px-2 py-px text-xs">Üst çene</span>}
                    {it.isLowerJaw && <span className="rounded-full bg-muted px-2 py-px text-xs">Alt çene</span>}
                    {it.notes && <span className="text-muted-foreground">· {it.notes}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {showTotals && (
                      <span className="font-medium tabular-nums">
                        {pm?.isPerTooth && !pm?.isJawSpecific && <span className="mr-2 text-muted-foreground">x{it.toothNumbers?.length || 1}</span>}
                        {formatTRY(pendingLineTotal(it, priceMap))}
                      </span>
                    )}
                    <Button size="icon-sm" variant="ghost" aria-label="Sil" onClick={() => setPending((p) => p.filter((_, i) => i !== idx))}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
            <div className="mt-2 flex flex-wrap items-center justify-end gap-3 border-t pt-3">
              {showTotals && <span className="text-sm font-medium">Toplam: {formatTRY(overallTotal)}</span>}
              <Button onClick={handleSuggestAll} disabled={loading || !patient}>
                Tedavileri Öner
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-sm text-muted-foreground">Yükleniyor…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export default function TreatmentAddPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-sm text-muted-foreground">Yükleniyor…</p>}>
      <TreatmentAddClient />
    </Suspense>
  );
}
