"use client";

import { useCallback, useEffect, useState } from "react";
import { FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchSmsTemplates, smsAuthHeader, type SmsTemplate } from "@/lib/sms";

const VARIABLES: [string, string][] = [
  ["{HASTA_ADI}", "Hasta Adı"],
  ["{HASTA_SOYADI}", "Hasta Soyadı"],
  ["{HASTA_TAM_ADI}", "Tam Adı"],
  ["{TELEFON}", "Telefon"],
  ["{TARIH}", "Tarih"],
  ["{SAAT}", "Saat"],
  ["{KLINIK_ADI}", "Klinik Adı"],
  ["{DOKTOR_ADI}", "Doktor Adı"],
  ["{RANDEVU_TARIHI}", "Randevu Tarihi"],
  ["{RANDEVU_SAATI}", "Randevu Saati"],
];

export default function SmsTemplatesPage() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SmsTemplate | null>(null);
  const [formData, setFormData] = useState({ name: "", content: "" });

  const load = useCallback(() => {
    fetchSmsTemplates()
      .then((t) => t && setTemplates(t))
      .catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.content.trim()) return;
    try {
      const url = editing ? `/api/sms/templates/${editing.template_id}` : "/api/sms/templates";
      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...smsAuthHeader() },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowModal(false);
        setEditing(null);
        setFormData({ name: "", content: "" });
        load();
      }
    } catch {}
  };

  const handleDelete = async (templateId: number) => {
    try {
      const res = await fetch(`/api/sms/templates/${templateId}`, { method: "DELETE", headers: smsAuthHeader() });
      if (res.ok) load();
    } catch {}
  };

  const openNew = () => {
    setEditing(null);
    setFormData({ name: "", content: "" });
    setShowModal(true);
  };

  return (
    <div className="mx-auto w-full max-w-6xl">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="text-base">SMS Şablonları</CardTitle>
            <CardDescription>Gönderimlerde kullanılan hazır mesajlar.</CardDescription>
          </div>
          <Button size="sm" onClick={openNew}>
            <Plus className="size-4" />
            Yeni Şablon Ekle
          </Button>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <FileText className="size-8 text-muted-foreground" />
              <p className="font-medium">Henüz SMS şablonu yok</p>
              <p className="text-sm text-muted-foreground">İlk SMS şablonunuzu oluşturmak için &quot;Yeni Şablon Ekle&quot; düğmesine tıklayın.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <div key={t.template_id} className="flex flex-col gap-2 rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{t.name}</p>
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Düzenle"
                        onClick={() => {
                          setEditing(t);
                          setFormData({ name: t.name, content: t.content });
                          setShowModal(true);
                        }}
                      >
                        <Pencil />
                      </Button>
                      <Button size="icon-sm" variant="ghost" aria-label="Sil" onClick={() => handleDelete(t.template_id)}>
                        <Trash2 className="text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <p className="min-h-16 flex-1 rounded-md bg-muted/50 p-2.5 text-sm whitespace-pre-wrap">{t.content}</p>
                  {t.created_at && <p className="text-right text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString("tr-TR")}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <DialogHeader>
              <DialogTitle>{editing ? "Şablon Düzenle" : "Yeni Şablon Ekle"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Şablon Adı</Label>
              <Input id="tpl-name" required placeholder="Örn: Randevu Hatırlatması" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-content">Şablon İçeriği</Label>
              <div className="flex flex-wrap gap-1">
                {VARIABLES.map(([token, label]) => (
                  <Button key={token} type="button" size="xs" variant="outline" onClick={() => setFormData({ ...formData, content: formData.content + token })}>
                    + {label}
                  </Button>
                ))}
              </div>
              <Textarea
                id="tpl-content"
                required
                rows={6}
                placeholder="SMS içeriğinizi buraya yazın… Örnek: Merhaba {HASTA_ADI}, randevunuz {TARIH} tarihindedir."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
              <div className="flex justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  <b>{"{TARIH}"}</b> = bugünün tarihi, <b>{"{RANDEVU_TARIHI}"}</b> = gerçek randevu tarihi. Değişkenler gönderimde doldurulur.
                </span>
                <span className="shrink-0 tabular-nums">{formData.content.length} karakter</span>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                İptal
              </Button>
              <Button type="submit">{editing ? "Güncelle" : "Oluştur"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
