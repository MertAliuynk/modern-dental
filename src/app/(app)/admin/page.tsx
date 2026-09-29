"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ClipboardList, ListOrdered, Stethoscope, Users, Wallet, type LucideIcon } from "lucide-react";
import { useSession } from "@/lib/session";
import { UserManagement } from "@/components/admin/user-management";
import { TreatmentTypeManagement } from "@/components/admin/treatment-type-management";
import { PriceListManagement } from "@/components/admin/price-list-management";
import { BranchManagement } from "@/components/admin/branch-management";
import { DoctorOrderManagement } from "@/components/admin/doctor-order-management";

type Tab = "users" | "treatments" | "pricelists" | "branches" | "doctororders";

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: "users", label: "Kullanıcılar", icon: Users },
  { id: "treatments", label: "Tedavi Türleri", icon: Stethoscope },
  { id: "pricelists", label: "Fiyat Listeleri", icon: Wallet },
  { id: "branches", label: "Şubeler", icon: Building2 },
  { id: "doctororders", label: "Doktor Sıraları", icon: ListOrdered },
];

export default function AdminPage() {
  const router = useRouter();
  const session = useSession();
  const [tab, setTab] = useState<Tab>("users");

  // Yalnızca yönetici (eski sitedeki kontrolle aynı)
  useEffect(() => {
    if (session.ready && session.token && session.role !== "admin") router.replace("/");
  }, [session.ready, session.token, session.role, router]);

  if (session.role !== "admin") return <p className="py-24 text-center text-sm text-muted-foreground">Yükleniyor…</p>;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <ClipboardList className="size-5 text-muted-foreground" />
            Sistem Yönetimi
          </h1>
          <p className="text-sm text-muted-foreground">Kullanıcılar, tedavi türleri, fiyatlar, şubeler ve hekim sıraları.</p>
        </div>
      </div>
      <div className="flex w-full gap-1 overflow-x-auto rounded-lg bg-muted p-1 sm:w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                tab === t.id ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-4" />
              {t.label}
            </button>
          );
        })}
      </div>
      {tab === "users" && <UserManagement />}
      {tab === "treatments" && <TreatmentTypeManagement />}
      {tab === "pricelists" && <PriceListManagement />}
      {tab === "branches" && <BranchManagement />}
      {tab === "doctororders" && <DoctorOrderManagement />}
    </div>
  );
}
