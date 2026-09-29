"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ColumnChart, SERIES, ShareList, StatTile } from "@/components/charts";
import { ReportHeader, ReportState, lastNDays, useReport } from "@/components/report-frame";
import { API } from "@/lib/api";

type Mode = "branches" | "doctors" | "comparison";
type Report = {
  days: string[];
  branches: { branch_id: number; branch_name: string; counts: number[]; total: number }[];
  doctors: { doctor_id: number; doctor_name: string; branch_name: string; counts: number[]; total: number }[];
  summary?: { totalPatients?: number; totalDoctors?: number; totalBranches?: number };
};

const MODES: { key: Mode; label: string }[] = [
  { key: "branches", label: "Şubeler" },
  { key: "doctors", label: "Doktorlar" },
  { key: "comparison", label: "Karşılaştırma" },
];

const dayLabel = (d: string) => d.slice(5).replace("-", ".");

export default function ExaminationReportsPage() {
  const [range, setRange] = useState(() => lastNDays(7));
  const [mode, setMode] = useState<Mode>("branches");
  const [branchSel, setBranchSel] = useState("");
  const [doctorSel, setDoctorSel] = useState("");
  const { report, error } = useReport<Report>(`${API}/reports/examination`, range);

  const header = <ReportHeader title="Muayene Raporları" description="Günlük muayene edilen hasta sayıları." range={range} onRange={setRange} modes={MODES} mode={mode} onMode={setMode} />;
  if (!report) return <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">{header}<ReportState error={error} /></div>;

  const branches = report.branches ?? [];
  const doctors = report.doctors ?? [];
  const selectedBranch = branchSel || branches[0]?.branch_name || "";
  const selectedDoctor = doctorSel || doctors[0]?.doctor_name || "";
  const days = report.days ?? [];

  let data: Record<string, unknown>[] = [];
  let series = [{ key: "v", label: "Hasta", color: SERIES[0] }];
  if (mode === "branches") {
    const b = branches.find((x) => x.branch_name === selectedBranch);
    data = days.map((d, i) => ({ day: dayLabel(d), v: b?.counts[i] ?? 0 }));
  } else if (mode === "doctors") {
    const doc = doctors.find((x) => x.doctor_name === selectedDoctor);
    data = days.map((d, i) => ({ day: dayLabel(d), v: doc?.counts[i] ?? 0 }));
  } else {
    // Karşılaştırmada ilk 8 şube (sabit renk sırası)
    const shown = branches.slice(0, 8);
    series = shown.map((b, i) => ({ key: `b${i}`, label: b.branch_name, color: SERIES[i] }));
    data = days.map((d, di) => Object.fromEntries([["day", dayLabel(d)], ...shown.map((b, i) => [`b${i}`, b.counts[di] ?? 0])]));
  }

  const shareItems =
    mode === "branches" || mode === "comparison"
      ? branches.map((b, i) => ({ label: b.branch_name, value: b.total, color: SERIES[i % 8] })).sort((a, b) => b.value - a.value)
      : doctors.map((d) => ({ label: `Dr. ${d.doctor_name}`, value: d.total })).sort((a, b) => b.value - a.value);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      {header}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Toplam hasta" value={report.summary?.totalPatients || 0} />
        <StatTile label="Toplam doktor" value={report.summary?.totalDoctors || 0} />
        <StatTile label="Toplam şube" value={report.summary?.totalBranches || 0} />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="min-w-0 lg:col-span-3">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle className="text-sm">
              {mode === "branches" && `${selectedBranch} · günlük hasta sayısı`}
              {mode === "doctors" && `Dr. ${selectedDoctor} · günlük hasta sayısı`}
              {mode === "comparison" && "Şubeler arası karşılaştırma"}
            </CardTitle>
            {mode === "branches" && (
              <NativeSelect className="w-56" value={selectedBranch} onChange={(e) => setBranchSel(e.target.value)}>
                {branches.map((b) => (
                  <option key={b.branch_id} value={b.branch_name}>
                    {b.branch_name} ({b.total} hasta)
                  </option>
                ))}
              </NativeSelect>
            )}
            {mode === "doctors" && (
              <NativeSelect className="w-64" value={selectedDoctor} onChange={(e) => setDoctorSel(e.target.value)}>
                {doctors.map((d) => (
                  <option key={d.doctor_id} value={d.doctor_name}>
                    Dr. {d.doctor_name} - {d.branch_name} ({d.total} hasta)
                  </option>
                ))}
              </NativeSelect>
            )}
          </CardHeader>
          <CardContent>
            <ColumnChart data={data} xKey="day" series={series} unit="hasta" />
          </CardContent>
        </Card>
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Toplam dağılım · {mode === "doctors" ? "doktorlar" : "şubeler"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ShareList items={shareItems} unit="hasta" />
          </CardContent>
        </Card>
      </div>

      {mode === "doctors" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Doktor detayları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Doktor</TableHead>
                    <TableHead>Şube</TableHead>
                    <TableHead className="text-right">Toplam Hasta</TableHead>
                    <TableHead className="text-right">Günlük Ortalama</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors.map((d) => (
                    <TableRow key={d.doctor_id}>
                      <TableCell>Dr. {d.doctor_name}</TableCell>
                      <TableCell>{d.branch_name}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{d.total}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.total > 0 ? (d.total / days.length).toFixed(1) : "0"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
