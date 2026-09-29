import { APPT_VISUAL_LABEL, APPT_VISUAL_ORDER } from "@/lib/appointments";

/** Randevu durum renklerinin açıklaması — gerçek bloklarla aynı sınıflar. */
export function AppointmentLegend({ className = "", showClosed = false }: { className?: string; showClosed?: boolean }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground ${className}`}>
      {APPT_VISUAL_ORDER.map((v) => (
        <span key={v} className="flex items-center gap-1.5">
          <span className={`appt appt-${v} inline-block h-3.5 w-6`} style={{ "--appt-color": "#6366f1" } as React.CSSProperties} />
          {APPT_VISUAL_LABEL[v]}
        </span>
      ))}
      {showClosed && (
        <span className="flex items-center gap-1.5">
          <span className="appt appt-closed inline-block h-3.5 w-6" />
          Saat kapalı
        </span>
      )}
    </div>
  );
}
