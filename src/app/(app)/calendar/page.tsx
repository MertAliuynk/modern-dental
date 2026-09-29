"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import resourcePlugin from "@fullcalendar/resource";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import type { DateSelectArg, EventClickArg, EventContentArg, EventDropArg } from "@fullcalendar/core";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import { addDays, endOfMonth, endOfWeek, format, startOfMonth, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { AppointmentLegend } from "@/components/appointment-legend";
import { CreateAppointmentDialog } from "@/components/calendar/create-appointment-dialog";
import { AppointmentSummaryDialog, type RawAppointment } from "@/components/calendar/appointment-summary-dialog";
import { API } from "@/lib/api";
import { SCHEDULER_LICENSE_KEY, apptVisual, doctorColor, localDateStr, sortByDoctorOrder, type DoctorOrder } from "@/lib/appointments";

type ViewMode = "day" | "week" | "month";
type Doctor = { user_id: number; first_name: string; last_name: string };
type Branch = { branch_id: number; name: string; permanent_doctor_count?: number };
type User = { user_id?: number; role?: string; branch_id?: number; branchId?: number; first_name?: string; last_name?: string } | null;

const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function fcView(mode: ViewMode, allDoctors: boolean) {
  if (mode === "month") return "dayGridMonth";
  if (allDoctors) return mode === "day" ? "resourceTimeGridDay" : "resourceTimeGridWeek";
  return mode === "day" ? "timeGridDay" : "timeGridWeek";
}

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const [user, setUser] = useState<User>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorOrders, setDoctorOrders] = useState<DoctorOrder[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("all");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [appointments, setAppointments] = useState<RawAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [doctorPage, setDoctorPage] = useState(0);
  const [createSlot, setCreateSlot] = useState<{ when: Date; doctorId: string } | null>(null);
  const [summary, setSummary] = useState<RawAppointment | null>(null);

  const role = user?.role ?? "";
  const branchId = user?.branch_id || user?.branchId || null;
  const branchName = branches.find((b) => String(b.branch_id) === String(branchId))?.name ?? "";

  useEffect(() => {
    try {
      const u = localStorage.getItem("user");
      if (u) setUser(JSON.parse(u));
    } catch {}
    setUserLoaded(true);
  }, []);

  // Doktorlar (doktor rolü yalnızca kendini görür) ve doktor sıralaması
  useEffect(() => {
    if (!userLoaded) return;
    if (role === "doctor" && user?.user_id) {
      setDoctors([{ user_id: user.user_id, first_name: user.first_name || "Doktor", last_name: user.last_name || "" }]);
      setSelectedDoctorId(String(user.user_id));
    } else {
      const token = localStorage.getItem("token");
      fetch(`${API}/user/doctors/by-branch`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined })
        .then((r) => r.json())
        .then((d) => d?.success && setDoctors(d.data || []))
        .catch(() => {});
    }
    fetch(`${API}/doctor-order/doctor-order`)
      .then((r) => r.json())
      .then((d) => d?.success && setDoctorOrders(d.data || []))
      .catch(() => {});
  }, [userLoaded, role, user?.user_id, user?.first_name, user?.last_name]);

  useEffect(() => {
    fetch(`${API}/branch`)
      .then((r) => r.json())
      .then((d) => d?.success && Array.isArray(d.data) && setBranches(d.data))
      .catch(() => {});
  }, []);

  const isAllDoctors = role !== "doctor" && selectedDoctorId === "all";

  const range = useMemo(() => {
    if (viewMode === "day") {
      const iso = localDateStr(viewDate);
      return { start: iso, end: iso };
    }
    if (viewMode === "week") {
      return { start: format(startOfWeek(viewDate, { weekStartsOn: 1 }), "yyyy-MM-dd"), end: format(endOfWeek(viewDate, { weekStartsOn: 1 }), "yyyy-MM-dd") };
    }
    return { start: format(startOfMonth(viewDate), "yyyy-MM-dd"), end: format(endOfMonth(viewDate), "yyyy-MM-dd") };
  }, [viewDate, viewMode]);

  const fetchAppointments = useCallback(async () => {
    if (!userLoaded) return;
    setLoading(true);
    try {
      let url = `${API}/appointment?start_date=${range.start}&end_date=${range.end}`;
      if (!isAllDoctors && selectedDoctorId && selectedDoctorId !== "all") url += `&doctor_id=${encodeURIComponent(selectedDoctorId)}`;
      const res = await fetch(url);
      const data = await res.json();
      let list: RawAppointment[] = data?.success ? data.data : [];
      // Tüm doktorlar: yalnızca şubedeki doktorların randevuları
      if (isAllDoctors && doctors.length) {
        const allowed = new Set(doctors.map((d) => String(d.user_id)));
        list = list.filter((a) => allowed.has(String(a.doctor_id)));
      }
      setAppointments(list);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [userLoaded, range.start, range.end, selectedDoctorId, isAllDoctors, doctors]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Hekim sütunları: sıralı; şubenin sabit hekim sayısı kadarı bir sayfada
  const orderedDoctors = useMemo(() => sortByDoctorOrder(doctors, doctorOrders), [doctors, doctorOrders]);
  const permanentCount = branches.find((b) => String(b.branch_id) === String(branchId))?.permanent_doctor_count ?? 3;
  const maxPage = Math.max(0, Math.ceil(orderedDoctors.length / permanentCount) - 1);
  const pagedDoctors = orderedDoctors.slice(doctorPage * permanentCount, (doctorPage + 1) * permanentCount);

  const view = fcView(viewMode, isAllDoctors);

  // Takvimi state ile senkron tut
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (api.view.type !== view) api.changeView(view);
    api.gotoDate(viewDate);
  }, [view, viewDate]);

  const events = useMemo(
    () =>
      appointments.map((a) => {
        const start = new Date(a.appointment_time);
        const closed = a.status === "saatkapatildi";
        const color = doctorColor(a.doctor_id ?? 0);
        return {
          id: String(a.appointment_id),
          resourceId: String(a.doctor_id),
          title: a.patient_name || "",
          start,
          end: new Date(start.getTime() + (a.duration_minutes || 30) * 60000),
          backgroundColor: "transparent",
          borderColor: color,
          textColor: "inherit",
          classNames: ["appt", closed ? "appt-closed" : `appt-${apptVisual(a.status || "scheduled", start)}`],
          extendedProps: { raw: a, color, closed },
        };
      }),
    [appointments],
  );

  const goPrev = () => setViewDate((d) => addDays(d, viewMode === "day" ? -1 : viewMode === "week" ? -7 : -30));
  const goNext = () => setViewDate((d) => addDays(d, viewMode === "day" ? 1 : viewMode === "week" ? 7 : 30));

  const onSelect = (arg: DateSelectArg) => {
    const resourceId = (arg as unknown as { resource?: { id: string } }).resource?.id;
    const when = arg.allDay ? new Date(arg.start.getFullYear(), arg.start.getMonth(), arg.start.getDate(), 9, 0) : arg.start;
    setCreateSlot({
      when,
      doctorId: role === "doctor" ? String(user?.user_id) : resourceId ?? (selectedDoctorId !== "all" ? selectedDoctorId : ""),
    });
    calendarRef.current?.getApi().unselect();
  };

  const onEventMove = async (arg: EventDropArg | EventResizeDoneArg) => {
    try {
      const start = arg.event.start!;
      const end = arg.event.end ?? start;
      const duration = Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));
      const body: Record<string, unknown> = { appointmentTime: start.toISOString(), duration: Math.ceil(duration / 15) * 15 };
      const newResource = (arg as EventDropArg).newResource;
      if (newResource && String(newResource.id) !== String((arg.event.extendedProps.raw as RawAppointment).doctor_id)) body.doctorId = newResource.id;
      const res = await fetch(`${API}/appointment/${arg.event.id}/time-duration`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      await res.json();
    } catch {}
    fetchAppointments();
  };

  function renderEventContent(arg: EventContentArg) {
    const raw = arg.event.extendedProps.raw as RawAppointment;
    const closed = arg.event.extendedProps.closed as boolean;
    const showDoctor = !arg.view.type.startsWith("resource") && isAllDoctors;
    return (
      <div className="flex flex-col gap-0.5 overflow-hidden px-1 py-0.5 text-[11px] leading-tight">
        <span className="appt-title truncate font-semibold">
          {arg.timeText && <span className="mr-1 font-normal opacity-70">{arg.timeText}</span>}
          {closed ? "Saat kapalı" : raw.patient_name}
        </span>
        {showDoctor && (
          <span className="truncate opacity-80">
            {raw.doctor_first_name} {raw.doctor_last_name}
          </span>
        )}
        {raw.notes && <span className="truncate opacity-75">{raw.notes}</span>}
      </div>
    );
  }

  const dayTitle = `${viewDate.getDate()} ${AYLAR[viewDate.getMonth()]} ${GUNLER[viewDate.getDay()]}`;

  return (
    <div className="mx-auto w-full max-w-[1800px]">
      <Card>
        <CardContent className="space-y-3 p-2 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" aria-label="Önceki" onClick={goPrev}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setViewDate(new Date())}>
                Bugün
              </Button>
              <Button variant="outline" size="icon" aria-label="Sonraki" onClick={goNext}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <p className="order-first w-full text-center text-sm font-semibold sm:order-0 sm:w-auto sm:flex-1">
              {viewMode === "day" ? dayTitle : viewMode === "month" ? `${AYLAR[viewDate.getMonth()]} ${viewDate.getFullYear()}` : `${range.start.split("-").reverse().join(".")} – ${range.end.split("-").reverse().join(".")}`}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <NativeSelect className="w-28" value={viewMode} onChange={(e) => setViewMode(e.target.value as ViewMode)}>
                <option value="day">Günlük</option>
                <option value="week">Haftalık</option>
                {!isAllDoctors && <option value="month">Aylık</option>}
              </NativeSelect>
              {role !== "doctor" && (
                <NativeSelect
                  className="w-44"
                  value={selectedDoctorId}
                  disabled={viewMode === "month"}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    setDoctorPage(0);
                    if (e.target.value !== "all" && viewMode === "month") setViewMode("day");
                  }}
                >
                  <option value="all">Tüm Doktorlar</option>
                  {doctors.map((d) => (
                    <option key={d.user_id} value={String(d.user_id)}>
                      {d.first_name} {d.last_name}
                    </option>
                  ))}
                </NativeSelect>
              )}
              <Input
                type="date"
                className="w-36"
                value={format(viewDate, "yyyy-MM-dd")}
                onChange={(e) => e.target.value && setViewDate(new Date(`${e.target.value}T00:00:00`))}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-y py-2">
            <AppointmentLegend showClosed />
            {isAllDoctors && orderedDoctors.length > permanentCount && (
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon-sm" aria-label="Önceki hekimler" disabled={doctorPage === 0} onClick={() => setDoctorPage((p) => Math.max(0, p - 1))}>
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  Doktorlar {doctorPage + 1} / {maxPage + 1}
                </span>
                <Button variant="ghost" size="icon-sm" aria-label="Sonraki hekimler" disabled={doctorPage >= maxPage} onClick={() => setDoctorPage((p) => Math.min(maxPage, p + 1))}>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <div style={isAllDoctors && viewMode !== "month" ? { minWidth: `${Math.max(pagedDoctors.length * (viewMode === "week" ? 20 : 12), 35)}rem` } : { minWidth: "35rem" }}>
              <FullCalendar
                ref={calendarRef}
                schedulerLicenseKey={SCHEDULER_LICENSE_KEY}
                plugins={[resourcePlugin, resourceTimeGridPlugin, dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={view}
                initialDate={viewDate}
                headerToolbar={false}
                locale="tr"
                firstDay={1}
                allDaySlot={false}
                slotMinTime="09:00:00"
                slotMaxTime="24:00:00"
                scrollTime="09:00:00"
                slotDuration="00:15:00"
                slotLabelInterval="01:00"
                slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
                dayHeaderFormat={{ weekday: "long", day: "2-digit", month: "2-digit" }}
                nowIndicator
                height={820}
                editable
                selectable
                eventDisplay="block"
                resources={pagedDoctors.map((d) => ({ id: String(d.user_id), title: `${d.first_name} ${d.last_name}`, extendedProps: { color: doctorColor(d.user_id) } }))}
                resourceLabelContent={(arg) => (
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <span className="size-2.5 shrink-0 rounded-full" style={{ background: arg.resource.extendedProps.color as string }} />
                    <span className="truncate">Dt. {arg.resource.title}</span>
                  </span>
                )}
                events={events}
                eventDidMount={(arg) => {
                  arg.el.style.setProperty("--appt-color", arg.event.extendedProps.color as string);
                  const raw = arg.event.extendedProps.raw as RawAppointment;
                  arg.el.title = [raw.patient_name, `${raw.doctor_first_name ?? ""} ${raw.doctor_last_name ?? ""}`.trim(), raw.status_tr && `Durum: ${raw.status_tr}`, raw.notes && `Not: ${raw.notes}`]
                    .filter(Boolean)
                    .join("\n");
                }}
                eventContent={renderEventContent}
                eventClick={(arg: EventClickArg) => setSummary(arg.event.extendedProps.raw as RawAppointment)}
                eventDrop={onEventMove}
                eventResize={onEventMove}
                select={onSelect}
                navLinks={viewMode !== "day"}
                navLinkDayClick={(date) => {
                  setViewDate(date);
                  setViewMode("day");
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && <div className="fixed right-4 bottom-4 rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-lg">Yükleniyor…</div>}

      <CreateAppointmentDialog
        open={!!createSlot}
        onClose={() => setCreateSlot(null)}
        onCreated={fetchAppointments}
        when={createSlot?.when ?? null}
        initialDoctorId={createSlot?.doctorId ?? ""}
        role={role}
        user={user}
        branchId={branchId}
        branchName={branchName}
        doctors={doctors}
        branches={branches}
      />

      <AppointmentSummaryDialog appointment={summary} onClose={() => setSummary(null)} onChanged={fetchAppointments} branchName={branchName} />
    </div>
  );
}
