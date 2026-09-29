"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FullCalendar from "@fullcalendar/react";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import type { EventClickArg, EventContentArg } from "@fullcalendar/core";
import { Clock, UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { API } from "@/lib/api";
import { SCHEDULER_LICENSE_KEY, apptVisual, doctorColor, localDateStr, sortByDoctorOrder, type DoctorOrder } from "@/lib/appointments";
import { AppointmentLegend } from "@/components/appointment-legend";

type Doctor = { user_id: number; first_name: string; last_name: string };
type EventInfo = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  doctorId: number;
  patient: string;
  note: string;
  patientId?: number;
  status: string;
};

const timeFmt = new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit" });

export function TodayCalendar({ role, userId }: { role: string; userId: number | null }) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EventInfo | null>(null);

  // Şubenin doktorları + doktor sıralaması
  useEffect(() => {
    const branchId = localStorage.getItem("branchId");
    if (!branchId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch(`${API}/branch/${branchId}/doctors`).then((r) => r.json()),
      fetch(`${API}/doctor-order/doctor-order`).then((r) => r.json()),
    ])
      .then(([docRes, orderRes]) => {
        const list: Doctor[] = docRes.success && Array.isArray(docRes.data) ? docRes.data : [];
        const orders: DoctorOrder[] = orderRes.success && Array.isArray(orderRes.data) ? orderRes.data : [];
        const sorted = sortByDoctorOrder(list, orders);
        setDoctors(role === "doctor" && userId ? sorted.filter((d) => String(d.user_id) === String(userId)) : sorted);
      })
      .catch(() => setDoctors([]))
      .finally(() => setLoading(false));
  }, [role, userId]);

  // Doktorlar gelince bugünkü randevular
  useEffect(() => {
    if (doctors.length === 0) return;
    const branchId = localStorage.getItem("branchId");
    const todayStr = localDateStr();
    Promise.all(
      doctors.map((doc) =>
        fetch(`${API}/appointment?branch_id=${branchId}&doctor_id=${doc.user_id}&start_date=${todayStr}&end_date=${todayStr}`)
          .then((r) => r.json())
          .then((data) => {
            if (!data.success || !Array.isArray(data.data)) return [];
            return data.data.map((item: Record<string, unknown>) => {
              const closed = item.status === "saatkapatildi";
              const patient = closed ? "" : ((item.patient_name as string) || `${item.patient_first_name} ${item.patient_last_name}`);
              const note = (item.notes as string) || "";
              const start = new Date(item.appointment_time as string);
              return {
                id: item.appointment_id as number,
                title: `${patient}${patient && note ? " - " : ""}${note}`,
                start,
                end: new Date(start.getTime() + ((item.duration_minutes as number) || 30) * 60000),
                doctorId: doc.user_id,
                patient,
                note,
                patientId: closed ? undefined : ((item.patient_id as number) || (item.patientId as number)),
                status: item.status as string,
              } satisfies EventInfo;
            });
          }),
      ),
    ).then((results) => {
      let all: EventInfo[] = results.flat();
      if (role === "doctor" && userId) all = all.filter((e) => String(e.doctorId) === String(userId));
      setEvents(all);
    });
  }, [doctors, role, userId]);

  function renderEventContent(arg: EventContentArg) {
    const { note, closed } = arg.event.extendedProps as { note: string; closed: boolean };
    return (
      <div className="flex flex-col gap-0.5 overflow-hidden px-1 py-0.5 text-[11px] leading-tight">
        <span className="appt-title truncate font-semibold">{closed ? note || "Saat kapalı" : arg.event.extendedProps.patient}</span>
        {!closed && note && <span className="truncate opacity-75">{note}</span>}
      </div>
    );
  }

  return (
    <Card className="min-w-0">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Bugünkü Randevu Takvimi</CardTitle>
          <CardDescription>{new Intl.DateTimeFormat("tr-TR", { dateStyle: "full" }).format(new Date())}</CardDescription>
        </div>
        <Button size="sm" variant="outline" nativeButton={false} render={<Link href="/calendar" />}>
          Takvimi Aç
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Yükleniyor…</p>
        ) : doctors.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Bu şubede doktor bulunamadı.</p>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${Math.max(doctors.length * 9, 20)}rem` }}>
              <FullCalendar
                schedulerLicenseKey={SCHEDULER_LICENSE_KEY}
                plugins={[resourceTimeGridPlugin]}
                initialView="resourceTimeGridDay"
                headerToolbar={false}
                locale="tr"
                allDaySlot={false}
                slotMinTime="09:00:00"
                slotMaxTime="23:00:00"
                scrollTime="09:00:00"
                slotDuration="00:15:00"
                slotLabelInterval="01:00"
                slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                height={460}
                nowIndicator
                resources={doctors.map((d) => ({ id: String(d.user_id), title: `${d.first_name} ${d.last_name}`, extendedProps: { color: doctorColor(d.user_id) } }))}
                resourceLabelContent={(arg) => (
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: arg.resource.extendedProps.color as string }} />
                    <span className="truncate">{arg.resource.title}</span>
                  </span>
                )}
                events={events.map((e) => {
                  const closed = e.status === "saatkapatildi";
                  return {
                    id: String(e.id),
                    resourceId: String(e.doctorId),
                    title: e.title,
                    start: e.start,
                    end: e.end,
                    backgroundColor: "transparent",
                    borderColor: doctorColor(e.doctorId),
                    textColor: "inherit",
                    classNames: ["appt", closed ? "appt-closed" : `appt-${apptVisual(e.status, e.start)}`],
                    extendedProps: { ...e, closed },
                  };
                })}
                eventDidMount={(arg) => arg.el.style.setProperty("--appt-color", doctorColor(arg.event.extendedProps.doctorId))}
                eventContent={renderEventContent}
                eventClick={(arg: EventClickArg) => setSelected(arg.event.extendedProps as EventInfo)}
              />
            </div>
          </div>
        )}
        <AppointmentLegend className="border-t border-border pt-3" showClosed />
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Randevu Özeti</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <UserRound className="size-4 text-muted-foreground" />
                {selected.patient ? (
                  selected.patientId ? (
                    <Link href={`/patients/card?id=${selected.patientId}`} className="font-medium hover:underline">
                      {selected.patient}
                    </Link>
                  ) : (
                    <span className="font-medium">{selected.patient}</span>
                  )
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                {timeFmt.format(selected.start)} - {timeFmt.format(selected.end)}
              </div>
              {selected.note && <p className="rounded-md bg-muted px-3 py-2 text-muted-foreground">{selected.note}</p>}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
