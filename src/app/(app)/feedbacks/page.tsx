"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CalendarClock, CheckCircle2, ChevronDown, Clock, Phone, Search } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { API } from "@/lib/api";

type FeedbackItem = {
  planning_id: number;
  treatment_id: number;
  interval: string;
  interval_display: string;
  planned_date: string;
  treatment_name: string;
  completed_at: string;
  status: string;
  days_until_due: number;
};
type PendingFeedback = { patient_id: number; patient_name: string; phone: string; earliest_feedback_date: string; feedback_items: FeedbackItem[] };
type HistoryItem = {
  feedback_id: number;
  treatment_id: number;
  interval: string;
  interval_display: string;
  feedback_date: string;
  notes: string;
  treatment_name: string;
};
type FeedbackHistory = { patient_id: number; patient_name: string; phone: string; total_feedbacks: number; last_feedback_date: string; feedback_items: HistoryItem[] };

// Durum: renk + ikon + metin birlikte (renk tek başına anlam taşımaz)
const STATUS: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  due: { label: "Geçmiş", color: "var(--status-critical)", icon: AlertCircle },
  upcoming: { label: "Yaklaşan", color: "var(--status-warning)", icon: Clock },
  future: { label: "Gelecek", color: "var(--status-good)", icon: CheckCircle2 },
};
const statusOf = (s: string) => STATUS[s] ?? STATUS.future;

function StatusBadge({ status, prefix }: { status: string; prefix?: string }) {
  const s = statusOf(status);
  const Icon = s.icon;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium">
      <Icon className="size-3.5" style={{ color: s.color }} />
      {prefix}
      {s.label}
    </span>
  );
}

const INTERVALS = [
  { value: "all", label: "Tümü" },
  { value: "1_week", label: "1 Hafta" },
  { value: "1_month", label: "1 Ay" },
  { value: "3_months", label: "3 Ay" },
  { value: "6_months", label: "6 Ay" },
];

const formatDateTime = (d: string) => new Date(d).toLocaleDateString("tr-TR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("token")}`, "Content-Type": "application/json" };
}

function PatientHistoryCard({ patient }: { patient: FeedbackHistory }) {
  const [expanded, setExpanded] = useState(false);
  const [intervalSel, setIntervalSel] = useState("all");
  const [editing, setEditing] = useState<HistoryItem | null>(null);
  const [editNote, setEditNote] = useState("");
  const [saving, setSaving] = useState(false);
  // Kaydedilen notlar sayfa yenilenmeden görünsün diye yerel olarak tutulur.
  const [savedNotes, setSavedNotes] = useState<Record<number, string>>({});

  const items = (intervalSel === "all" ? patient.feedback_items : patient.feedback_items.filter((i) => i.interval === intervalSel)).map((i) =>
    i.feedback_id in savedNotes ? { ...i, notes: savedNotes[i.feedback_id] } : i,
  );

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/feedback/${editing.feedback_id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ notes: editNote }) });
      const data = await res.json();
      if (data.success) {
        setSavedNotes((prev) => ({ ...prev, [editing.feedback_id]: editNote }));
        setEditing(null);
      } else toast.error(data.message || "Güncelleme başarısız");
    } catch (e) {
      toast.error("Sunucu hatası: " + e);
    }
    setSaving(false);
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <button type="button" onClick={() => setExpanded((v) => !v)} className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/60 ${expanded ? "bg-accent/40" : ""}`}>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{patient.patient_name}</p>
          <p className="text-xs text-muted-foreground">
            {patient.phone} · Son geri dönüş: {formatDateTime(patient.last_feedback_date)}
          </p>
        </div>
        <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="space-y-3 border-t p-3">
          <div className="flex flex-wrap gap-1">
            {INTERVALS.map((o) => (
              <Button key={o.value} size="xs" variant={intervalSel === o.value ? "default" : "outline"} onClick={() => setIntervalSel(o.value)}>
                {o.label}
                {o.value !== "all" && ` (${patient.feedback_items.filter((i) => i.interval === o.value).length})`}
              </Button>
            ))}
          </div>
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {intervalSel === "all" ? "Bu hasta için geri dönüş kaydı bulunmuyor." : "Seçilen aralık için geri dönüş kaydı bulunmuyor."}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Tedavi</TableHead>
                    <TableHead>Aralık</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead>Not</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((f, idx) => (
                    <TableRow key={f.feedback_id}>
                      <TableCell className="text-muted-foreground tabular-nums">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{f.treatment_name}</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{f.interval_display}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(f.feedback_date)}</TableCell>
                      <TableCell className="max-w-64 whitespace-pre-line">{f.notes || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            setEditing(f);
                            setEditNote(f.notes || "");
                          }}
                        >
                          Düzenle
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Geri Dönüş Notunu Düzenle</DialogTitle>
            <DialogDescription>
              {patient.patient_name} · {editing?.treatment_name}
            </DialogDescription>
          </DialogHeader>
          <Textarea rows={4} autoFocus value={editNote} onChange={(e) => setEditNote(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" disabled={saving} onClick={() => setEditing(null)}>
              İptal
            </Button>
            <Button disabled={saving} onClick={save}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function FeedbacksPage() {
  const [tab, setTab] = useState<"pending" | "history">("pending");
  const [pending, setPending] = useState<PendingFeedback[]>([]);
  const [history, setHistory] = useState<FeedbackHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<{ patient: PendingFeedback; item: FeedbackItem } | null>(null);
  const [notes, setNotes] = useState("");

  const loadPending = async () => {
    try {
      const res = await fetch(`${API}/feedback/pending`, { headers: authHeaders() });
      if (res.ok) setPending((await res.json()).data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API}/feedback/history?search=${searchTerm}`, { headers: authHeaders() });
      if (res.ok) setHistory((await res.json()).data || []);
    } catch {}
  };

  useEffect(() => {
    loadPending();
  }, []);

  const changeTab = (t: "pending" | "history") => {
    setTab(t);
    if (t === "history") loadHistory();
  };

  const createFeedback = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`${API}/feedback`, { method: "POST", headers: authHeaders(), body: JSON.stringify({ planning_id: selected.item.planning_id, notes }) });
      if (res.ok) {
        toast.success("Geri dönüş başarıyla kaydedildi");
        setSelected(null);
        setNotes("");
        loadPending();
      } else {
        const err = await res.json();
        toast.error(err.message || "Geri dönüş kaydedilirken hata oluştu");
      }
    } catch {
      toast.error("Geri dönüş kaydedilirken hata oluştu");
    }
  };

  const pendingCount = pending.reduce((t, p) => t + p.feedback_items.length, 0);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Geri Dönüşler</h1>
          <p className="text-sm text-muted-foreground">Tamamlanan tedaviler sonrası planlanan hasta kontrolleri.</p>
        </div>
        <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
          {(
            [
              ["pending", `Bekleyen (${pendingCount})`],
              ["history", "Geçmiş"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => changeTab(k)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${tab === k ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {tab === "pending" &&
        (loading ? (
          <p className="py-24 text-center text-sm text-muted-foreground">Yükleniyor…</p>
        ) : pending.length === 0 ? (
          <Card>
            <CardContent>
              <p className="py-16 text-center text-sm text-muted-foreground">Bekleyen geri dönüş bulunmuyor.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {pending.map((patient, i) => {
              const earliest = patient.feedback_items.reduce((a, c) => (new Date(c.planned_date) < new Date(a.planned_date) ? c : a));
              return (
                <Card key={i} className="border-l-4" style={{ borderLeftColor: statusOf(earliest.status).color }}>
                  <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
                    <div>
                      <CardTitle className="text-base">{patient.patient_name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Phone className="size-3.5" />
                        {patient.phone}
                      </CardDescription>
                    </div>
                    <StatusBadge status={earliest.status} prefix="En yakın: " />
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2">
                    {patient.feedback_items.map((item, j) => (
                      <div key={j} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {item.treatment_name} · {item.interval_display}
                          </p>
                          <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarClock className="size-3.5" />
                            {new Date(item.planned_date).toLocaleDateString("tr-TR")}
                            {item.days_until_due <= 0 && <span className="font-medium text-destructive">({Math.abs(Math.floor(item.days_until_due))} gün geçmiş)</span>}
                            {item.days_until_due > 0 && item.days_until_due <= 3 && <span className="font-medium text-amber-600 dark:text-amber-400">({Math.floor(item.days_until_due)} gün kaldı)</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge status={item.status} />
                          <Button size="sm" onClick={() => setSelected({ patient, item })}>
                            Geri Dönüş Yaz
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}

      {tab === "history" && (
        <Card>
          <CardHeader>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                loadHistory();
              }}
            >
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-8" placeholder="Hasta adı, soyadı veya telefon ile ara…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Button type="submit">Ara</Button>
            </form>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Geri dönüş geçmişi bulunmuyor.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {history.map((p) => (
                  <PatientHistoryCard key={p.patient_id} patient={p} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) {
            setSelected(null);
            setNotes("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Geri Dönüş Kaydet</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-2 rounded-md border p-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Hasta</p>
                <p className="font-medium">{selected.patient.patient_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefon</p>
                <p className="font-medium">{selected.patient.phone}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tedavi</p>
                <p className="font-medium">{selected.item.treatment_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Kontrol Türü</p>
                <p className="font-medium">{selected.item.interval_display}</p>
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="fb-notes">Geri Dönüş Notları</Label>
            <Textarea id="fb-notes" rows={6} placeholder="Hastanın durumu, şikayetleri, öneriler…" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelected(null);
                setNotes("");
              }}
            >
              İptal
            </Button>
            <Button onClick={createFeedback}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
