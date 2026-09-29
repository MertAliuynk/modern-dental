"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { NativeSelect } from "@/components/ui/native-select";
import { API } from "@/lib/api";

const DISEASES = [
  "Kalp hastalıkları",
  "Şeker hastalığı",
  "Tansiyon sorunu",
  "Epilepsi (sara)",
  "Guatr (Trold tabletleri)",
  "Kan hastalıkları",
  "İlaç alerjisi",
  "Akciğer hastalıkları",
  "Sinüzit",
  "AIDS",
  "Ateşli romatizma",
  "Hepatit",
  "Eklem romatizması",
  "Astım, saman nezlesi",
  "Böbrek karaciğer",
  "Zührevi hastalık bozuklukları",
];

type Anamnez = {
  tedavi: string;
  hastalik: string;
  hastalikList: boolean;
  hastaliklar: string[];
  radyoterapi: string;
  kanama: string;
  ilacAlerji: string;
  digerSorun: string;
  kadinBilgi: string;
  kotuAliskanlik: string;
  disMuayene: string;
};

const EMPTY_ANAMNEZ: Anamnez = {
  tedavi: "",
  hastalik: "",
  hastalikList: false,
  hastaliklar: [],
  radyoterapi: "",
  kanama: "",
  ilacAlerji: "",
  digerSorun: "",
  kadinBilgi: "",
  kotuAliskanlik: "",
  disMuayene: "",
};

const EMPTY_FORM = { firstName: "", lastName: "", phone: "", tc: "", doctors: [] as string[], birthDate: "", anamnez: EMPTY_ANAMNEZ };

type Doctor = { user_id: number; first_name: string; last_name: string; branch_id?: number };
type Branch = { branch_id: number; name: string };

/** JWT'nin yük kısmını okur (eski sitedeki jwt-decode ile aynı iş, doğrulama yapmaz). */
function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    const json = decodeURIComponent(
      atob(part.replace(/-/g, "+").replace(/_/g, "/"))
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function YesNo({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1.5">
      {(["evet", "hayir"] as const).map((v) => (
        <Button key={v} type="button" size="sm" variant={value === v ? "default" : "outline"} onClick={() => onChange(v)}>
          {v === "evet" ? "Evet" : "Hayır"}
        </Button>
      ))}
    </div>
  );
}

export function NewPatientClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingPatientId = searchParams.get("id");
  const isEdit = Boolean(editingPatientId);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tcError, setTcError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/branch`)
      .then((r) => r.json())
      .then((d) => d.success && Array.isArray(d.data) && setBranches(d.data));
  }, []);

  // Doktorlar, token'daki şubeye göre süzülür
  useEffect(() => {
    const token = localStorage.getItem("token");
    const decoded = token ? decodeJwt(token) : null;
    const branchId = decoded ? decoded.branch_id || decoded.branchId || null : null;
    fetch(`${API}/user/doctors`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return setDoctors([]);
        setDoctors(branchId !== null && branchId !== undefined && branchId !== "" ? d.data.filter((x: Doctor) => String(x.branch_id) === String(branchId)) : d.data);
      })
      .catch(() => setDoctors([]));
  }, []);

  // Düzenleme modunda hastayı yükle
  useEffect(() => {
    if (!editingPatientId) return;
    fetch(`${API}/patient/${editingPatientId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.success || !d.data) return;
        const p = d.data;
        setForm((f) => ({
          ...f,
          firstName: p.first_name || "",
          lastName: p.last_name || "",
          phone: p.phone || "",
          tc: p.tc_number || "",
          doctors: p.doctors ? p.doctors.map((x: { doctor_id: number }) => String(x.doctor_id)) : [],
          birthDate: p.birth_date ? p.birth_date.split("T")[0] : "",
        }));
        setSelectedBranch(p.branch_id ? String(p.branch_id) : "");
      })
      .catch(() => {});
  }, [editingPatientId]);

  const setAnamnez = <K extends keyof Anamnez>(key: K, value: Anamnez[K]) => setForm((f) => ({ ...f, anamnez: { ...f.anamnez, [key]: value } }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    if (!form.firstName || !form.lastName || !form.phone || !form.birthDate || form.doctors.length === 0) {
      setMessage("Lütfen tüm hasta bilgilerini ve en az bir doktoru seçin.");
      setLoading(false);
      return;
    }
    if (!isEdit) {
      if (!form.tc) {
        setMessage("TC Kimlik No zorunlu.");
        setLoading(false);
        return;
      }
      if (form.tc.length !== 11) {
        setMessage("TC Kimlik No 11 haneli olmalı.");
        setLoading(false);
        return;
      }
    }
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      if (isEdit) {
        const res = await fetch(`${API}/patient/${editingPatientId}`, {
          method: "PUT",
          headers,
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            birthDate: form.birthDate,
            anamnez: form.anamnez,
            branchId: selectedBranch,
          }),
        });
        const data = await res.json();
        if (data.success) {
          await fetch(`${API}/patient/${editingPatientId}/doctors`, {
            method: "POST",
            headers,
            body: JSON.stringify({ doctorIds: form.doctors.map(Number) }),
          });
          setMessage("Hasta başarıyla güncellendi!");
          router.push(`/patients/card?id=${editingPatientId}`);
          return;
        }
        setMessage(data.message || "Kayıt sırasında hata oluştu.");
      } else {
        const res = await fetch(`${API}/patient`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            doctors: form.doctors,
            birthDate: form.birthDate,
            anamnez: form.anamnez,
            tc: form.tc,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setMessage("Hasta başarıyla kaydedildi!");
          setForm(EMPTY_FORM);
        } else {
          const msg = data.message?.toLowerCase() || "";
          if (msg.includes("duplicate") || msg.includes("tc") || (msg.includes("kimlik") && msg.includes("var")) || (msg.includes("zaten") && (msg.includes("tc") || msg.includes("kimlik")))) {
            setMessage("Aynı TC ile eklenmiş hasta vardır.");
          } else {
            setMessage("Tc kimlik hatası aynı tc ye sahip hasta vardır.");
          }
        }
      }
    } catch {
      setMessage("Sunucu hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const success = message?.includes("başarı");

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">{isEdit ? "Hasta Bilgilerini Düzenle" : "Hasta Bilgilerini Tanımla"}</h1>
        <p className="text-sm text-muted-foreground">Yıldızlı (*) alanlar zorunludur.</p>
      </div>

      {message && (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            success ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-destructive/30 bg-destructive/10 text-destructive"
          }`}
        >
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hasta Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">Adı *</Label>
              <Input id="firstName" required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Soyadı *</Label>
              <Input id="lastName" required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon numarası *</Label>
              <Input
                id="phone"
                inputMode="tel"
                required
                value={form.phone}
                onChange={(e) => /^\d*$/.test(e.target.value) && setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tc">TC kimlik no *</Label>
              <Input
                id="tc"
                inputMode="numeric"
                maxLength={11}
                required={!isEdit}
                disabled={isEdit}
                aria-invalid={!!tcError}
                value={form.tc}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!/^\d*$/.test(v)) return;
                  setForm((f) => ({ ...f, tc: v }));
                  setTcError(v.length === 0 || v.length === 11 ? "" : "TC Kimlik No 11 haneli olmalı.");
                }}
              />
              {tcError && <p className="text-xs text-destructive">{tcError}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>İlgili Doktor(lar) *</Label>
              <div className="flex max-h-52 flex-col gap-2 overflow-y-auto rounded-md border p-2.5">
                {doctors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Doktor bulunamadı.</p>
                ) : (
                  doctors.map((d) => {
                    const id = String(d.user_id);
                    return (
                      <label key={id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={form.doctors.includes(id)}
                          onCheckedChange={(v) => setForm((f) => ({ ...f, doctors: v ? [...f.doctors, id] : f.doctors.filter((x) => x !== id) }))}
                        />
                        {d.first_name} {d.last_name}
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birthDate">Doğum Tarihi *</Label>
              <Input id="birthDate" type="date" required value={form.birthDate} onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))} />
            </div>
            {isEdit && (
              <div className="space-y-1.5">
                <Label htmlFor="branch">Şube *</Label>
                <NativeSelect id="branch" required value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                  <option value="">Şube seçiniz</option>
                  {branches.map((b) => (
                    <option key={b.branch_id} value={b.branch_id}>
                      {b.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Anamnez Bilgileri</CardTitle>
          <CardDescription>Hastanın sağlık geçmişi.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>Şu anda herhangi bir tedavi görüyor musunuz? İlaç kullanıyor musunuz?</Label>
              <Textarea value={form.anamnez.tedavi} onChange={(e) => setAnamnez("tedavi", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Herhangi bir hastalığınız var mı? Geçirdiniz mi?</Label>
              <Textarea value={form.anamnez.hastalik} onChange={(e) => setAnamnez("hastalik", e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox checked={form.anamnez.hastalikList} onCheckedChange={(v) => setAnamnez("hastalikList", !!v)} />
              Hastalık Listesini Göster
            </label>
            {form.anamnez.hastalikList && (
              <div className="grid gap-2 rounded-md border bg-muted/40 p-3 sm:grid-cols-2">
                {DISEASES.map((disease) => (
                  <label key={disease} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={form.anamnez.hastaliklar.includes(disease)}
                      onCheckedChange={(v) =>
                        setAnamnez("hastaliklar", v ? [...form.anamnez.hastaliklar, disease] : form.anamnez.hastaliklar.filter((d) => d !== disease))
                      }
                    />
                    {disease}
                  </label>
                ))}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Baş ve boyun bölgesinde radyoterapi gördünüz mü?</Label>
              <YesNo value={form.anamnez.radyoterapi} onChange={(v) => setAnamnez("radyoterapi", v)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cerrahi müdahale veya yaralanma sonrası kanama uzun sürer mi?</Label>
              <YesNo value={form.anamnez.kanama} onChange={(v) => setAnamnez("kanama", v)} />
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="space-y-1.5">
              <Label>İlaç alerjiniz var mı?</Label>
              <Textarea value={form.anamnez.ilacAlerji} onChange={(e) => setAnamnez("ilacAlerji", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Bunların dışında herhangi bir tıbbi sorununuz var mı?</Label>
              <Textarea value={form.anamnez.digerSorun} onChange={(e) => setAnamnez("digerSorun", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Kadınlarda hamilelik, düşük, adet ve menapoz bilgileri</Label>
              <Textarea value={form.anamnez.kadinBilgi} onChange={(e) => setAnamnez("kadinBilgi", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Kötü alışkanlıklarınız var mı?</Label>
              <Textarea value={form.anamnez.kotuAliskanlik} onChange={(e) => setAnamnez("kotuAliskanlik", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>En son dişhekimi muayenesi, tedavisi?</Label>
              <Textarea value={form.anamnez.disMuayene} onChange={(e) => setAnamnez("disMuayene", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? (isEdit ? "Güncelleniyor…" : "Kaydediliyor…") : isEdit ? "Hasta Bilgilerini Güncelle" : "Hasta Bilgilerini Kaydet"}
        </Button>
      </div>
    </form>
  );
}
