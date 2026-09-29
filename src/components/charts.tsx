"use client";

import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

export type Series = { key: string; label: string; color: string };

/** Sabit sıralı kategorik renkler (globals.css --series-*). */
export const SERIES = Array.from({ length: 8 }, (_, i) => `var(--series-${i + 1})`);

const AXIS_TICK = { fill: "var(--chart-axis)", fontSize: 11 };

export function StatTile({ label, value, swatch }: { label: string; value: React.ReactNode; swatch?: string }) {
  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {swatch && <span className="size-2 rounded-full" style={{ background: swatch }} />}
          {label}
        </p>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function Legend({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {series.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}

function ChartTooltip({ active, payload, label, unit }: TooltipContentProps<number, string> & { unit?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((p) => (
        <p key={String(p.dataKey)} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums">
            {p.value}
            {unit ? ` ${unit}` : ""}
          </span>
        </p>
      ))}
    </div>
  );
}

export function ColumnChart({
  data,
  xKey,
  series,
  height = 280,
  unit,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: Series[];
  height?: number;
  unit?: string;
}) {
  if (data.length === 0) return <p className="py-16 text-center text-sm text-muted-foreground">Bu aralıkta veri yok.</p>;
  return (
    <div className="space-y-3">
      <Legend series={series} />
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barGap={2} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey={xKey} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "var(--chart-grid)" }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={(p) => <ChartTooltip {...(p as TooltipContentProps<number, string>)} unit={unit} />} />
          {series.map((s) => (
            <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendChart({
  data,
  xKey,
  series,
  height = 280,
  unit,
}: {
  data: Record<string, unknown>[];
  xKey: string;
  series: Series[];
  height?: number;
  unit?: string;
}) {
  if (data.length === 0) return <p className="py-16 text-center text-sm text-muted-foreground">Bu aralıkta veri yok.</p>;
  return (
    <div className="space-y-3">
      <Legend series={series} />
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
          <XAxis dataKey={xKey} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "var(--chart-grid)" }} interval="preserveStartEnd" />
          <YAxis allowDecimals={false} tick={AXIS_TICK} tickLine={false} axisLine={false} />
          <Tooltip cursor={{ stroke: "var(--chart-axis)", strokeWidth: 1 }} content={(p) => <ChartTooltip {...(p as TooltipContentProps<number, string>)} unit={unit} />} />
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Toplam içindeki payları sıralı yatay çubuklarla gösterir (pasta grafik yerine). */
export function ShareList({ items, unit }: { items: { label: string; value: number; color?: string }[]; unit: string }) {
  const total = items.reduce((s, i) => s + (Number(i.value) || 0), 0);
  if (items.length === 0 || total === 0) return <p className="py-10 text-center text-sm text-muted-foreground">Bu aralıkta veri yok.</p>;
  const max = Math.max(...items.map((i) => Number(i.value) || 0));
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((i) => {
        const v = Number(i.value) || 0;
        return (
          <div key={i.label} className="space-y-1" title={`${i.label}: ${v} ${unit}`}>
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="truncate">{i.label}</span>
              <span className="shrink-0 tabular-nums">
                <span className="font-medium">{v}</span> <span className="text-xs text-muted-foreground">%{Math.round((v / total) * 100)}</span>
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full" style={{ width: `${max ? (v / max) * 100 : 0}%`, background: i.color ?? "var(--series-1)" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
