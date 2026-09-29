import { API } from "@/lib/api";

export type TreatmentStatus = "önerilen" | "onaylanan" | "tamamlanan";

export type Treatment = {
  treatment_id: number;
  treatment_type_id: number;
  status: TreatmentStatus | string;
  doctor_id?: number;
  doctor_name?: string;
  treatment_name?: string;
  treatment_type_name?: string;
  name?: string;
  tooth_numbers?: number[];
  toothNumbers?: number[];
  is_upper_jaw?: boolean;
  isUpperJaw?: boolean;
  is_lower_jaw?: boolean;
  isLowerJaw?: boolean;
  is_per_tooth?: boolean;
  notes?: string;
  note?: string;
  suggested_at?: string;
  approved_at?: string;
  completed_at?: string;
  created_at?: string;
};

export type TreatmentType = {
  treatment_type_id: number;
  name: string;
  category?: string;
  is_per_tooth?: boolean;
  is_jaw_specific?: boolean;
};

export type PriceEntry = { base: number; upper: number; lower: number; isPerTooth: boolean; isJawSpecific: boolean };
export type PriceMap = Record<number, PriceEntry>;

export const STATUS_LABEL: Record<string, string> = {
  önerilen: "Önerilen",
  onaylanan: "Onaylanan",
  tamamlanan: "Tamamlanan",
};

const isUpperFDI = (n: number) => (n >= 11 && n <= 18) || (n >= 21 && n <= 28) || (n >= 51 && n <= 55) || (n >= 61 && n <= 65);
const isLowerFDI = (n: number) => (n >= 31 && n <= 38) || (n >= 41 && n <= 48) || (n >= 71 && n <= 75) || (n >= 81 && n <= 85);
const isUpperSeq = (n: number) => n >= 1 && n <= 16;
const isLowerSeq = (n: number) => n >= 17 && n <= 32;
const isUpper = (n: number) => isUpperFDI(n) || isUpperSeq(n);
const isLower = (n: number) => isLowerFDI(n) || isLowerSeq(n);

export function teethOf(tr: Treatment): number[] {
  const t = tr.tooth_numbers || tr.toothNumbers || [];
  return Array.isArray(t) ? t : [];
}

export function jawsOf(tr: Treatment) {
  const teeth = teethOf(tr);
  const hasUpper = !!tr.is_upper_jaw || !!tr.isUpperJaw || teeth.some(isUpper);
  const hasLower = !!tr.is_lower_jaw || !!tr.isLowerJaw || teeth.some(isLower);
  return { hasUpper, hasLower };
}

export function jawLabel(tr: Treatment) {
  const { hasUpper, hasLower } = jawsOf(tr);
  if (hasUpper && hasLower) return "Üst ve Alt çene";
  if (hasUpper) return "Üst çene";
  if (hasLower) return "Alt çene";
  return "";
}

/** Tedavinin durumuna göre gösterilecek tarih etiketi. */
export function treatmentDateLabel(tr: Treatment): string | null {
  const d = (s: string) => new Date(s).toLocaleDateString("tr-TR");
  if (tr.status === "tamamlanan" && tr.completed_at) return `Tamamlanma: ${d(tr.completed_at)}`;
  if (tr.status === "onaylanan" && tr.approved_at) return `Onaylanma: ${d(tr.approved_at)}`;
  if (tr.status === "önerilen" && tr.suggested_at) return `Önerilme: ${d(tr.suggested_at)}`;
  if (tr.completed_at) return `Tamamlanma: ${d(tr.completed_at)}`;
  if (tr.approved_at) return `Onaylanma: ${d(tr.approved_at)}`;
  if (tr.suggested_at) return `Önerilme: ${d(tr.suggested_at)}`;
  if (tr.created_at) return `Kayıt: ${d(tr.created_at)}`;
  return null;
}

/** Şubenin aktif fiyat listesini okur (eski sitedeki iki istekle aynı). */
export async function loadPriceMap(branchId: number, treatmentTypes: TreatmentType[]): Promise<PriceMap> {
  try {
    const res = await fetch(`${API}/price-list?branch_id=${branchId}&active_only=true`);
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data) || data.data.length === 0) return {};
    const active = data.data[0];
    const res2 = await fetch(`${API}/price-list/${active.price_list_id}`);
    const data2 = await res2.json();
    if (!data2.success) return {};
    const map: PriceMap = {};
    for (const it of data2.data.items || []) {
      const tt = treatmentTypes.find((x) => x.treatment_type_id === it.treatment_type_id);
      map[it.treatment_type_id] = {
        base: Number(it.base_price) || 0,
        upper: Number(it.upper_jaw_price) || 0,
        lower: Number(it.lower_jaw_price) || 0,
        isPerTooth: !!tt?.is_per_tooth,
        isJawSpecific: !!tt?.is_jaw_specific,
      };
    }
    return map;
  } catch {
    return {};
  }
}

export function lineTotal(tr: Treatment, priceMap: PriceMap): number {
  const pm = priceMap[tr.treatment_type_id];
  if (!pm) return 0;
  if (pm.isJawSpecific) {
    // Çene başına bir kez ücretlendirilir
    const { hasUpper, hasLower } = jawsOf(tr);
    let total = 0;
    if (hasUpper) total += pm.upper || pm.base;
    if (hasLower) total += pm.lower || pm.base;
    if (!hasUpper && !hasLower) total += pm.base;
    return total;
  }
  const qty = pm.isPerTooth ? teethOf(tr).length : 1;
  return pm.base * qty;
}

export const formatTRY = (n: number) => `₺${n.toLocaleString("tr-TR")}`;
