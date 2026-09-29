"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ColumnChart, SERIES } from "@/components/charts";
import { ReportHeader, ReportState, lastNDays } from "@/components/report-frame";
import { API } from "@/lib/api";

type Row = { treatment_type: string; accepted: number; rejected: number };

// Eski sitede de vardı ama menüde bağlantısı yoktu; adres korunur.
export default function TreatmentAcceptReportsPage() {
  const [range, setRange] = useState(() => lastNDays(7));
  const [data, setData] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    fetch(`${API}/reports/treatment-accept?start=${range.start}&end=${range.end}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !d.data) return setError("Veri alınamadı.");
        setData(d.data);
      })
      .catch(() => setError("Sunucuya bağlanılamadı."));
  }, [range.start, range.end]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <ReportHeader title="Tedavi Kabul Raporları" description="Tedavi türüne göre kabul edilen ve reddedilen öneriler." range={range} onRange={setRange} />
      {!data || error ? (
        <ReportState error={error} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Kabul / red</CardTitle>
          </CardHeader>
          <CardContent>
            <ColumnChart
              xKey="treatment_type"
              unit="tedavi"
              data={data}
              series={[
                { key: "accepted", label: "Kabul Edilen", color: SERIES[0] },
                { key: "rejected", label: "Reddedilen", color: SERIES[1] },
              ]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
