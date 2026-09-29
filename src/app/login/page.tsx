"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Settings2, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { API } from "@/lib/api";

type LoginResponse = {
  success: boolean;
  message?: string;
  token: string;
  user: { role?: string; branch_id?: number; branch_name?: string; first_name?: string; last_name?: string };
};

function saveSession(data: LoginResponse) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  if (data.user.role) localStorage.setItem("role", data.user.role);
  if (data.user.branch_id) localStorage.setItem("branchId", data.user.branch_id.toString());
  if (data.user.branch_name) localStorage.setItem("branch", data.user.branch_name);
  if (data.user.first_name && data.user.last_name) localStorage.setItem("name", `${data.user.first_name} ${data.user.last_name}`);
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminData, setAdminData] = useState<LoginResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data: LoginResponse = await res.json();
      if (!data.success) {
        setError(data.message || "Giriş başarısız");
        return;
      }
      // Yönetici önce hangi paneli kullanacağını seçer.
      if (data.user.role === "admin") {
        setAdminData(data);
        return;
      }
      saveSession(data);
      router.push("/");
    } catch {
      setError("Sunucu hatası");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminChoice = (choice: "dental" | "management") => {
    if (!adminData) return;
    saveSession(adminData);
    router.push(choice === "dental" ? "/" : "/admin");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 px-4 py-16">
      <div className="flex w-full max-w-sm flex-col items-center">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-tight">Karadeniz Diş</p>
            <p className="text-xs text-muted-foreground leading-tight">Ağız ve Diş Sağlığı Polikliniği</p>
          </div>
        </div>

        {adminData ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl">Panel Seçimi</CardTitle>
              <CardDescription>Hangi paneli kullanmak istiyorsunuz?</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button size="lg" className="w-full" onClick={() => handleAdminChoice("dental")}>
                <Stethoscope className="size-4" />
                Dental Yönetimi
              </Button>
              <Button size="lg" variant="outline" className="w-full" onClick={() => handleAdminChoice("management")}>
                <Settings2 className="size-4" />
                Sistem Yönetimi
              </Button>
              <Button variant="ghost" className="mt-2 w-full" onClick={() => setAdminData(null)}>
                Geri Dön
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl">Giriş Yap</CardTitle>
              <CardDescription>Hesabınıza erişmek için bilgilerinizi girin.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="username">Kullanıcı Adı</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Şifre</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <p className="text-center text-sm text-destructive">{error}</p>}
                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
