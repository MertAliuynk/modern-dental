// Randevu durumlarının görsel dili (stiller: globals.css `.appt-*`).
// Backend'in durum değerleri: scheduled, attended, missed, ertelendi, saatkapatildi.

export type ApptVisual = "upcoming" | "overdue" | "done" | "noshow" | "postponed";

export function apptVisual(status: string, startsAt: string | Date, now = new Date()): ApptVisual {
  if (status === "attended") return "done";
  if (status === "missed") return "noshow";
  if (status === "ertelendi") return "postponed";
  // Saati geçmiş ama hâlâ "scheduled" → işaretlenmesi gerekiyor.
  return new Date(startsAt) <= now ? "overdue" : "upcoming";
}

export const APPT_VISUAL_LABEL: Record<ApptVisual, string> = {
  upcoming: "Bekleniyor",
  overdue: "Saati geçti · işaretlenmedi",
  done: "Geldi",
  noshow: "Gelmedi",
  postponed: "Ertelendi",
};

export const APPT_VISUAL_ORDER: ApptVisual[] = ["upcoming", "overdue", "done", "noshow", "postponed"];

/** Eski sitedeki SMS metni — birebir aynı. */
export function appointmentSmsText(name: string, branchName: string, when: Date | null) {
  const d = when ? when.toLocaleDateString("tr-TR") : "gün";
  const t = when ? when.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", hour12: false }) : "saat";
  return `Sayın ${name}, Karadeniz Ağız ve Diş Sağlığı Poliklinikleri tarafından ${branchName || "şube"} şubesine ${d} ${t} saatinde randevunuz oluşturulmuştur.`;
}

// Backend'de hekim rengi yok; her hekime id'sine göre sabit bir renk verilir.
const DOCTOR_PALETTE = ["#2563eb", "#059669", "#d97706", "#db2777", "#7c3aed", "#0891b2", "#dc2626", "#65a30d", "#c026d3", "#0d9488"];

export function doctorColor(doctorId: number | string) {
  const n = Number(doctorId);
  const idx = Number.isFinite(n) ? Math.abs(n) % DOCTOR_PALETTE.length : 0;
  return DOCTOR_PALETTE[idx];
}

export type DoctorOrder = { id?: number; doctor_id: number; order_num: number; branch_id?: number };

/** Doktor sıralaması (Sistem Yönetimi > Doktor Sıraları) uygulanmış liste; sırası olmayanlar sona. */
export function sortByDoctorOrder<T extends { user_id: number }>(doctors: T[], orders: DoctorOrder[]): T[] {
  const ordered = orders
    .slice()
    .sort((a, b) => a.order_num - b.order_num)
    .map((o) => doctors.find((d) => String(d.user_id) === String(o.doctor_id)))
    .filter((d): d is T => !!d);
  const rest = doctors.filter((d) => !orders.some((o) => String(o.doctor_id) === String(d.user_id)));
  return [...ordered, ...rest];
}

/** Yerel saate göre YYYY-MM-DD. */
export function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// FullCalendar Scheduler (hekim sütunlu görünümler) lisans anahtarı —
// birleşikdişhizmetleri projesindekiyle aynı. DİKKAT: Bu FullCalendar'ın
// ticari olmayan kullanım anahtarıdır; ticari kullanımda satın alınan
// anahtarla değiştirilmelidir (fullcalendar.io/pricing).
export const SCHEDULER_LICENSE_KEY = "CC-Attribution-NonCommercial-NoDerivatives";
