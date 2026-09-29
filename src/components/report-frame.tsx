"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { localDateStr } from "@/lib/appointments";

export function lastNDays(n: number) {
  return { start: localDateStr(new Date(Date.now() - (n - 1) * 86400000)), end: localDateStr() };
}

/** Rapor verisini {start,end} aralığı için getirir; eski sitedeki gibi `success` false ise hata verir. */
export function useReport<T>(endpoint: string, range: { start: string; end: string }) {
  const [report, setReport] = useState<T | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    setError("");
    setReport(null);
    fetch(`${endpoint}?start=${range.start}&end=${range.end}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d.success) setError("Veri alınamadı.");
        else setReport(d);
      })
      .catch(() => !cancelled && setError("Sunucuya bağlanılamadı."));
    return () => {
      cancelled = true;
    };
  }, [endpoint, range.start, range.end]);
  return { report, error };
}

export function ReportHeader<M extends string>({
  title,
  description,
  range,
  onRange,
  modes,
  mode,
  onMode,
}: {
  title: string;
  description: string;
  range: { start: string; end: string };
  onRange: (r: { start: string; end: string }) => void;
  modes?: { key: M; label: string }[];
  mode?: M;
  onMode?: (m: M) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {[7, 30, 90].map((n) => {
            const r = lastNDays(n);
            const active = r.start === range.start && r.end === range.end;
            return (
              <Button key={n} size="sm" variant={active ? "default" : "outline"} onClick={() => onRange(r)}>
                Son {n} gün
              </Button>
            );
          })}
          <Input type="date" className="w-36" value={range.start} onChange={(e) => e.target.value && onRange({ ...range, start: e.target.value })} aria-label="Başlangıç" />
          <span className="text-muted-foreground">–</span>
          <Input type="date" className="w-36" value={range.end} onChange={(e) => e.target.value && onRange({ ...range, end: e.target.value })} aria-label="Bitiş" />
        </div>
      </div>
      {modes && onMode && (
        <div className="inline-flex w-fit flex-wrap gap-1 rounded-lg bg-muted p-1">
          {modes.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => onMode(m.key)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${mode === m.key ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function ReportState({ error }: { error: string }) {
  return <p className={`py-24 text-center text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>{error || "Yükleniyor…"}</p>;
}
