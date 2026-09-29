"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ColumnChart, SERIES, ShareList, StatTile, TrendChart } from "@/components/charts";
import { ReportHeader, ReportState, lastNDays, useReport } from "@/components/report-frame";
import { API } from "@/lib/api";

type Mode = "overview" | "doctors" | "popular" | "trends";
type Report = {
  summary?: {
    total_treatments?: number;
    suggested_treatments?: number;
    approved_treatments?: number;
    completed_treatments?: number;
    approval_rate?: number;
    completion_rate?: number;
  };
  popular_treatments?: { name: string; total: number; approved: number; completed: number }[];
  doctors?: {
    doctor_id: number;
    doctor_name: string;
    branch_name: string;
    suggested_treatments: number;
    approved_treatments: number;
    completed_treatments: number;
    total_treatments: number;
    approval_rate: number;
    most_used_treatment: string;
    most_used_count: number;
  }[];
  daily_treatments?: { date: string; suggested: number; approved: number; completed: number }[];
};

const MODES: { key: Mode; label: string }[] = [
  { key: "overview", label: "Genel Görünüm" },
  { key: "doctors", label: "Doktor Analizi" },
  { key: "popular", label: "Popüler Tedaviler" },
  { key: "trends", label: "Günlük Trendler" },
];

// Durum serileri her grafikte aynı renkte
const STATUS_SERIES = [
  { key: "suggested", label: "Önerilen", color: SERIES[1] },
  { key: "approved", label: "Onaylanan", color: SERIES[0] },
  { key: "completed", label: "Tamamlanan", color: SERIES[2] },
];

export default function TreatmentReportsPage() {
  const [range, setRange] = useState(() => lastNDays(7));
  const [mode, setMode] = useState<Mode>("overview");
  const { report, error } = useReport<Report>(`${API}/reports/treatment`, range);

  const header = (
    <ReportHeader title="Tedavi Raporları" description="Önerilen, onaylanan ve tamamlanan tedaviler." range={range} onRange={setRange} modes={MODES} mode={mode} onMode={setMode} />
  );
  if (!report) return <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">{header}<ReportState error={error} /></div>;

  const s = report.summary ?? {};
  const popular = report.popular_treatments ?? [];
  const doctors = report.doctors ?? [];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      {header}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Toplam tedavi" value={s.total_treatments || 0} />
        <StatTile label="Önerilen" value={s.suggested_treatments || 0} swatch={STATUS_SERIES[0].color} />
        <StatTile label="Onaylanan" value={s.approved_treatments || 0} swatch={STATUS_SERIES[1].color} />
        <StatTile label="Tamamlanan" value={s.completed_treatments || 0} swatch={STATUS_SERIES[2].color} />
        <StatTile label="Onay oranı" value={`%${s.approval_rate || 0}`} />
        <StatTile label="Tamamlama oranı" value={`%${s.completion_rate || 0}`} />
      </div>

      <div className={`grid gap-4 ${mode === "overview" ? "lg:grid-cols-2" : ""}`}>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-sm">
              {mode === "overview" && "Tedavi durum analizi"}
              {mode === "doctors" && "Doktor performans karşılaştırması"}
              {mode === "popular" && "En çok uygulanan tedaviler"}
              {mode === "trends" && "Günlük tedavi trendleri"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mode === "overview" && (
              <ShareList
                unit="tedavi"
                items={[
                  { label: "Önerilen", value: s.suggested_treatments || 0, color: STATUS_SERIES[0].color },
                  { label: "Onaylanan", value: s.approved_treatments || 0, color: STATUS_SERIES[1].color },
                  { label: "Tamamlanan", value: s.completed_treatments || 0, color: STATUS_SERIES[2].color },
                ]}
              />
            )}
            {mode === "doctors" && (
              <ColumnChart
                unit="tedavi"
                xKey="name"
                series={STATUS_SERIES}
                data={doctors.slice(0, 10).map((d) => ({ name: `Dr. ${d.doctor_name}`, suggested: d.suggested_treatments, approved: d.approved_treatments, completed: d.completed_treatments }))}
              />
            )}
            {mode === "popular" && (
              <ColumnChart unit="tedavi" xKey="name" series={[{ key: "total", label: "Tedavi sayısı", color: SERIES[0] }]} data={popular.slice(0, 8).map((t) => ({ name: t.name, total: t.total }))} />
            )}
            {mode === "trends" && (
              <TrendChart
                unit="tedavi"
                xKey="day"
                series={STATUS_SERIES}
                data={(report.daily_treatments ?? []).map((d) => ({ day: d.date.slice(5).replace("-", "."), suggested: d.suggested, approved: d.approved, completed: d.completed }))}
              />
            )}
          </CardContent>
        </Card>

        {mode === "overview" && (
          <Card className="min-w-0">
            <CardHeader>
              <CardTitle className="text-sm">Popüler tedaviler (ilk 5)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {popular.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Bu aralıkta veri yok.</p>
              ) : (
                popular.slice(0, 5).map((t, i) => (
                  <div key={t.name} className="flex items-center justify-between gap-2 rounded-md border px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        <span className="text-muted-foreground">#{i + 1}</span> {t.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Onay: {t.approved + t.completed}, Tamamlanan: {t.completed}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-sm font-semibold tabular-nums">{t.total}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-sm">Doktor performans detayları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Doktor</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                    <TableHead className="text-right">Onay %</TableHead>
                    <TableHead>En Çok</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {doctors.slice(0, 10).map((d) => (
                    <TableRow key={d.doctor_id}>
                      <TableCell>
                        <p>Dr. {d.doctor_name}</p>
                        <p className="text-xs text-muted-foreground">{d.branch_name}</p>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{d.total_treatments}</TableCell>
                      <TableCell className="text-right tabular-nums">%{d.approval_rate}</TableCell>
                      <TableCell className="text-xs">
                        {d.most_used_treatment} ({d.most_used_count})
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="text-sm">Tedavi türleri detayları</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Tedavi</TableHead>
                    <TableHead className="text-right">Toplam</TableHead>
                    <TableHead className="text-right">Onaylanan</TableHead>
                    <TableHead className="text-right">Tamamlanan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popular.slice(0, 10).map((t, i) => (
                    <TableRow key={t.name}>
                      <TableCell>
                        <span className="text-muted-foreground">#{i + 1}</span> {t.name}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">{t.total}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.approved}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.completed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
