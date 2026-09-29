"use client";

import { useEffect, useState } from "react";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { fetchSmsPatients, fetchSmsTemplates, type SmsPatient, type SmsTemplate } from "@/lib/sms";

export default function ScheduledSmsPage() {
  const [patients, setPatients] = useState<SmsPatient[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Eski sitede de sayfa açılışında çağrılıyordu (zamanı gelmiş planlı SMS'ler).
    fetch("/api/sms/send-due-scheduled", { method: "POST" }).catch(() => {});
    fetchSmsPatients()
      .then((p) => p && setPatients(p))
      .catch(() => setPatients([]));
    fetchSmsTemplates()
      .then((t) => t && setTemplates(t))
      .catch(() => setTemplates([]));
  }, []);

  // Eski sitedeki davranışla aynı: backend'e istek göndermez, yalnızca onay mesajı gösterir.
  const handleSend = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("SMS planlandı!");
    }, 1000);
  };

  const patient = patients.find((p) => p.patient_id === selectedPatient);
  const template = templates.find((t) => t.template_id === selectedTemplate);
  const disabled = !selectedPatient || !selectedTemplate || !selectedDate || !selectedTime || loading;

  return (
    <div className="mx-auto w-full max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">İleri Tarihli SMS Planla</CardTitle>
          <CardDescription>Hasta, şablon ve gönderim zamanını seçin.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <Label>Hasta</Label>
            <NativeSelect value={selectedPatient ?? ""} onChange={(e) => setSelectedPatient(Number(e.target.value) || null)}>
              <option value="">Hasta seçiniz…</option>
              {patients.map((p) => (
                <option key={p.patient_id} value={p.patient_id}>
                  {p.first_name} {p.last_name} - {p.phone}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label>SMS Şablonu</Label>
            <NativeSelect value={selectedTemplate ?? ""} onChange={(e) => setSelectedTemplate(Number(e.target.value) || null)}>
              <option value="">Şablon seçiniz…</option>
              {templates.map((t) => (
                <option key={t.template_id} value={t.template_id}>
                  {t.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          {template && (
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="mb-1 text-xs text-muted-foreground">Şablon Önizleme</p>
              <p className="text-sm whitespace-pre-wrap">{template.content}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tarih</Label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Saat</Label>
              <Input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} />
            </div>
          </div>
          <div className="rounded-md border p-3 text-sm">
            <p className="text-xs text-muted-foreground">Seçim Özeti</p>
            <p>
              {patient ? `${patient.first_name} ${patient.last_name}` : "Hasta seçilmedi"}
              {template && `, "${template.name}" şablonu seçildi`}
              {selectedDate && selectedTime && `, ${selectedDate} ${selectedTime}`}
            </p>
          </div>
          <Button size="lg" disabled={disabled} onClick={handleSend}>
            <CalendarClock className="size-4" />
            {loading ? "Gönderiliyor…" : "SMS Planla"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
