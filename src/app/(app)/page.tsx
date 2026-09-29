"use client";

import { useSession } from "@/lib/session";
import { UpcomingAppointments } from "@/components/home/upcoming-appointments";
import { TodayCalendar } from "@/components/home/today-calendar";
import { PatientSearchCard } from "@/components/home/patient-search-card";

export default function HomePage() {
  const session = useSession();
  if (!session.ready) return null;
  const userId = session.user?.user_id != null ? Number(session.user.user_id) : null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <UpcomingAppointments role={session.role} userId={userId} />
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="min-w-0 lg:col-span-3">
          <TodayCalendar role={session.role} userId={userId} />
        </div>
        <div className="min-w-0 lg:col-span-2">
          <PatientSearchCard />
        </div>
      </div>
    </div>
  );
}
