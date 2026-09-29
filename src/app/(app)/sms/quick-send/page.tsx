"use client";

import { useEffect, useState } from "react";
import { Search, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { fetchSmsPatients, fetchSmsTemplates, smsAuthHeader, type SmsPatient, type SmsTemplate } from "@/lib/sms";

export default function QuickSmsPage() {
  const [patients, setPatients] = useState<SmsPatient[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<number[]>([]);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [allSelected, setAllSelected] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchSmsTemplates()
      .then((t) => t && setTemplates(t))
      .catch(() => {});
  }, []);

  // Aramada 400 ms bekleyip hastaları getir (ilk yükleme dahil)
  useEffect(() => {
    const t = setTimeout(() => {
      fetchSmsPatients(searchTerm)
        .then((p) => p && setPatients(p))
        .catch(() => {});
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const toggle = (id: number) => setSelectedPatients((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedPatients([]);
      setAllSelected(false);
    } else {
      setSelectedPatients(patients.map((p) => p.patient_id));
      setAllSelected(true);
    }
  };

  const template = templates.find((t) => t.template_id === selectedTemplate);

  const sendSms = async () => {
    if (selectedPatients.length === 0 || !selectedTemplate) return toast.error("Lütfen en az bir hasta ve şablon seçiniz!");
    setSending(true);
    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...smsAuthHeader() },
        body: JSON.stringify({ patientIds: selectedPatients, templateId: selectedTemplate }),
      });
      if (response.ok) {
        toast.success("SMS başarıyla gönderildi!");
        setSelectedPatients([]);
        setSelectedTemplate(null);
        setAllSelected(false);
      } else toast.error("SMS gönderilemedi!");
    } catch {
      toast.error("Bir hata oluştu!");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-4 lg:grid-cols-5">
      <Card className="min-w-0 lg:col-span-3">
        <CardHeader className="gap-3">
          <div>
            <CardTitle className="text-base">Hızlı SMS Gönder</CardTitle>
            <CardDescription>Hastaları seçip bir şablonla toplu SMS gönderin.</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-8" placeholder="İsim, soyisim veya TC ile arama yapın…" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Button variant="outline" onClick={toggleSelectAll}>
              {allSelected ? "Tümünü Kaldır" : "Tümünü Seç"} ({patients.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[28rem] overflow-y-auto rounded-md border">
            {patients.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Hasta bulunamadı.</p>
            ) : (
              patients.map((p) => {
                const checked = selectedPatients.includes(p.patient_id);
                return (
                  <label key={p.patient_id} className={`flex cursor-pointer items-center gap-3 border-b px-3 py-2 last:border-b-0 ${checked ? "bg-accent" : "hover:bg-accent/50"}`}>
                    <Checkbox checked={checked} onCheckedChange={() => toggle(p.patient_id)} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {p.first_name} {p.last_name}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {p.phone} • TC: {p.tc_number}
                      </span>
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit min-w-0 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Gönderim</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
          <div className="rounded-md border p-3 text-sm">
            <p className="text-xs text-muted-foreground">Seçim Özeti</p>
            <p>
              {selectedPatients.length} hasta seçildi
              {template && `, "${template.name}" şablonu seçildi`}
            </p>
          </div>
          <Button size="lg" disabled={sending || selectedPatients.length === 0 || !selectedTemplate} onClick={sendSms}>
            <Send className="size-4" />
            {sending ? "Gönderiliyor…" : "SMS Gönder"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
