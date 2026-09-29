"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ColumnChart, SERIES, ShareList, StatTile, TrendChart } from "@/components/charts";
import { ReportHeader, ReportState, lastNDays, useReport } from "@/components/report-frame";
import { API } from "@/lib/api";

type Mode = "doctors" | "branches" | "performance" | "trends";
type Report = {
  days?: string[];
  doctors?: {
    doctor_id: number;
    doctor_name: string;
    branch_name: string;
    total_appointments: number;
    attended_appointments: number;
    missed_appointments: number;
    attendance_rate: number;
    avg_daily: number | string;
    daily_counts?: number[];
  }[];
  branches?: { branch_name: string; total_appointments: number }[];
  summary?: { total_appointments?: number; total_attended?: number; total_missed?: number; overall_attendance_rate?: number };
};

const MODES: { key: Mode; label: string }[] = [
  { key: "doctors", label: "Doktorlar" },
  { key: "branches", label: "Şubeler" },
  { key: "performance", label: "Performans" },
  { key: "trends", label: "Trendler" },
];

export default function DoctorAppointmentReportsPage() {
  const [range, setRange] = useState(() => lastNDays(7));
  const [mode, setMode] = useState<Mode>("doctors");
  const [doctorSel, setDoctorSel] = useState("");
  const { report, error } = useReport<Report>(`${API}/reports/doctor-appointment`, range);

  const header = (
    <ReportHeader title="Hekim Başı Randevu Raporları" description="Hekim ve şube bazında randevu ve katılım." range={range} onRange={setRange} modes={MODES} mode={mode} onMode={setMode} />
  );
  if (!report) return <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">{header}<ReportState error={error} /></div>;

  const s = report.summary ?? {};
  const doctors = report.doctors ?? [];
  const selectedDoctor = doctorSel || doctors[0]?.doctor_name || "";
  const waiting = (s.total_appointments || 0) - (s.total_attended || 0) - (s.total_missed || 0);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Toplam randevu" value={s.total_appointments || 0} />
        <StatTile label="Geldi" value={s.total_attended || 0} swatch={SERIES[0]} />
        <StatTile label="Gelmedi" value={s.total_missed || 0} swatch={SERIES[1]} />
        <StatTile label="Katılım oranı" value={`%${s.overall_attendance_rate || 0}`} />
      </div>

      <div className={`grid gap-4 ${mode === "trends" ? "" : "lg:grid-cols-5"}`}>
        <Card className="min-w-0 lg:col-span-3">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm">
              {mode === "doctors" && "Doktor bazında randevu analizi"}
              {mode === "branches" && "Şube bazında randevu analizi"}
              {mode === "performance" && "Doktor performans karşılaştırması"}
              {mode === "trends" && `Dr. ${selectedDoctor} · günlük randevular`}
            </CardTitle>
            {mode === "trends" && (
              <NativeSelect className="w-72" value={selectedDoctor} onChange={(e) => setDoctorSel(e.target.value)}>
                {doctors.map((d) => (
                  <option key={d.doctor_id} value={d.doctor_name}>
                    Dr. {d.doctor_name} - {d.branch_name} ({d.total_appointments} randevu)
                  </option>
                ))}
              </NativeSelect>
            )}
          </CardHeader>
          <CardContent>
            {mode === "doctors" && (
              <ColumnChart unit="randevu" xKey="name" series={[{ key: "v", label: "Toplam randevu", color: SERIES[0] }]} data={doctors.map((d) => ({ name: `Dr. ${d.doctor_name}`, v: d.total_appointments }))} />
            )}
            {mode === "branches" && (
              <ColumnChart unit="randevu" xKey="name" series={[{ key: "v", label: "Toplam randevu", color: SERIES[0] }]} data={(report.branches ?? []).map((b) => ({ name: b.branch_name, v: b.total_appointments }))} />
            )}
            {mode === "performance" && (
              <ColumnChart
                unit="randevu"
                xKey="name"
                series={[
                  { key: "attended", label: "Geldi", color: SERIES[0] },
                  { key: "missed", label: "Gelmedi", color: SERIES[1] },
                ]}
                data={doctors.map((d) => ({ name: `Dr. ${d.doctor_name}`, attended: d.attended_appointments, missed: d.missed_appointments }))}
              />
            )}
            {mode === "trends" && (
              <TrendChart
                unit="randevu"
                xKey="day"
                series={[{ key: "v", label: "Randevu", color: SERIES[0] }]}
                data={(report.days ?? []).map((d, i) => ({ day: d.slice(5).replace("-", "."), v: doctors.find((x) => x.doctor_name === selectedDoctor)?.daily_counts?.[i] ?? 0 }))}
              />
            )}
          </CardContent>
        </Card>
        {mode !== "trends" && (
          <Card className="min-w-0 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm">Genel katılım dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <ShareList
                unit="randevu"
                items={[
                  { label: "Geldi", value: s.total_attended || 0, color: SERIES[0] },
                  { label: "Gelmedi", value: s.total_missed || 0, color: SERIES[1] },
                  { label: "Bekliyor", value: waiting, color: "var(--muted-foreground)" },
                ]}
              />
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Doktor performans detayları</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Doktor</TableHead>
                  <TableHead>Şube</TableHead>
                  <TableHead className="text-right">Toplam</TableHead>
                  <TableHead className="text-right">Geldi</TableHead>
                  <TableHead className="text-right">Gelmedi</TableHead>
                  <TableHead className="text-right">Katılım %</TableHead>
                  <TableHead className="text-right">Günlük Ort.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((d) => (
                  <TableRow key={d.doctor_id}>
                    <TableCell>Dr. {d.doctor_name}</TableCell>
                    <TableCell>{d.branch_name}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{d.total_appointments}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.attended_appointments}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.missed_appointments}</TableCell>
                    <TableCell className="text-right tabular-nums">%{d.attendance_rate}</TableCell>
                    <TableCell className="text-right tabular-nums">{d.avg_daily}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
