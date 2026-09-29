"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Home,
  CalendarClock,
  IdCard,
  Users,
  UserPlus,
  Upload,
  FileSignature,
  MessageSquare,
  Send,
  FileText,
  CalendarClock as CalendarSend,
  BarChart3,
  Stethoscope,
  ClipboardList,
  RotateCcw,
  ShieldCheck,
  PanelLeft,
  LogOut,
  ChevronsUpDown,
  ChevronDown,
  Sun,
  Moon,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PatientSelectDialog } from "@/components/patient-select-dialog";
import { clearSession, roleLabel, useSession } from "@/lib/session";

type NavLeaf = { label: string; href: string; icon: LucideIcon; /** Hasta seçme penceresini açar, sayfaya gitmez. */ opensPatientSelect?: boolean };
type NavEntry = NavLeaf | { label: string; icon: LucideIcon; children: NavLeaf[] };

// Eski sitenin menüsüyle aynı içerik ve rol kuralları.
function buildNav(role: string): NavEntry[] {
  const limited = role === "doctor" || role === "receptionist";
  const nav: NavEntry[] = [
    { label: "Ana Sayfa", href: "/", icon: Home },
    { label: "Randevu Takvimi", href: "/calendar", icon: CalendarClock },
    {
      label: "Hastalar",
      icon: Users,
      children: [
        { label: "Hasta Kartı Görüntüle", href: "/patients/card", icon: IdCard, opensPatientSelect: true },
        { label: "Yeni Hasta Ekle", href: "/patients/new", icon: UserPlus },
        { label: "Hasta Listesi", href: "/patients", icon: Users },
        { label: "Toplu Hasta Ekleme", href: "/patients/bulk", icon: Upload },
        { label: "Onam Formları", href: "/patients/consent", icon: FileSignature },
      ],
    },
    {
      label: "SMS",
      icon: MessageSquare,
      children: [
        { label: "Hızlı SMS Gönder", href: "/sms/quick-send", icon: Send },
        ...(limited ? [] : [{ label: "SMS Şablonları", href: "/sms/templates", icon: FileText }]),
        { label: "İleri Tarihli SMS", href: "/sms/scheduled", icon: CalendarSend },
      ],
    },
  ];
  if (!limited) {
    nav.push({
      label: "Raporlar",
      icon: BarChart3,
      children: [
        { label: "Muayene Raporları", href: "/reports/examination", icon: Stethoscope },
        { label: "Tedavi Raporları", href: "/reports/treatment", icon: ClipboardList },
        { label: "Hekim Başı Randevu Raporları", href: "/reports/doctor-appointment", icon: BarChart3 },
      ],
    });
  }
  nav.push({ label: "Geri Dönüşler", href: "/feedbacks", icon: RotateCcw });
  if (role === "admin") nav.push({ label: "Sistem Yönetimi", href: "/admin", icon: ShieldCheck });
  return nav;
}

function isActive(href: string, pathname: string) {
  if (href === "/" || href === "/patients") return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase("tr-TR"))
    .join("");
}

function NavLink({ item, pathname, onNavigate, onOpenPatientSelect }: { item: NavLeaf; pathname: string; onNavigate: () => void; onOpenPatientSelect: () => void }) {
  const Icon = item.icon;
  const active = isActive(item.href, pathname);
  const className = `flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
    active ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent hover:text-foreground"
  }`;
  if (item.opensPatientSelect) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          onNavigate();
          onOpenPatientSelect();
        }}
      >
        <Icon className="size-4 shrink-0" />
        <span className="truncate">{item.label}</span>
      </button>
    );
  }
  return (
    <Link href={item.href} onClick={onNavigate} className={className}>
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function NavGroup({
  entry,
  pathname,
  onNavigate,
  onOpenPatientSelect,
}: {
  entry: Extract<NavEntry, { children: NavLeaf[] }>;
  pathname: string;
  onNavigate: () => void;
  onOpenPatientSelect: () => void;
}) {
  const Icon = entry.icon;
  // Eski menüde alt başlıklar hep açıktı; aynı davranış.
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">{entry.label}</span>
        <ChevronDown className={`size-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="ml-4 flex flex-col gap-0.5 border-l border-sidebar-border pl-2.5 pt-0.5">
          {entry.children.map((child) => (
            <NavLink key={child.href} item={child} pathname={pathname} onNavigate={onNavigate} onOpenPatientSelect={onOpenPatientSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [patientSelectOpen, setPatientSelectOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (session.ready && !session.token) router.replace("/login");
  }, [session.ready, session.token, router]);

  const nav = buildNav(session.role);
  const closeMobile = () => setMobileOpen(false);
  const openPatientSelect = () => setPatientSelectOpen(true);

  const logout = () => {
    clearSession();
    router.push("/login");
  };

  const sidebarBody = (
    <>
      <div className="flex items-center gap-2.5 px-3 py-4">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Building2 className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">{session.branchName || "Karadeniz Diş"}</p>
          <p className="truncate text-xs text-muted-foreground leading-tight">Ağız ve Diş Sağlığı Polikliniği</p>
        </div>
      </div>
      <div className="px-2 pb-3">
        <Button className="w-full justify-center" nativeButton={false} render={<Link href="/patients/new" onClick={closeMobile} />}>
          <UserPlus className="size-4" />
          Yeni Hasta Ekle
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto px-2">
        <nav className="flex flex-col gap-0.5">
          {nav.map((entry) =>
            "children" in entry ? (
              <NavGroup key={entry.label} entry={entry} pathname={pathname} onNavigate={closeMobile} onOpenPatientSelect={openPatientSelect} />
            ) : (
              <NavLink key={entry.href} item={entry} pathname={pathname} onNavigate={closeMobile} onOpenPatientSelect={openPatientSelect} />
            ),
          )}
        </nav>
      </div>
      <div className="border-t border-sidebar-border p-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<button type="button" className="flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-accent" />}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {initials(session.userName)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium leading-tight">{session.userName || "Kullanıcı"}</span>
              <span className="block truncate text-xs text-muted-foreground leading-tight">{roleLabel(session.role)}</span>
            </span>
            <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem render={<button type="button" onClick={logout} />}>
              <LogOut className="size-4" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex print:hidden">
        {sidebarBody}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6 print:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Menüyü aç" className="lg:hidden" />}>
              <PanelLeft className="size-4.5" />
            </SheetTrigger>
            <SheetContent side="left" className="flex w-64 flex-col bg-sidebar p-0 text-sidebar-foreground">
              <SheetTitle className="sr-only">Gezinme Menüsü</SheetTitle>
              {sidebarBody}
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1" />

          <Button variant="outline" size="sm" onClick={openPatientSelect}>
            <IdCard className="size-4" />
            <span className="hidden sm:inline">Hasta Kartı</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Temayı değiştir"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
          </Button>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden bg-background p-4 sm:p-6">{session.token ? children : null}</main>
      </div>

      <PatientSelectDialog
        open={patientSelectOpen}
        onClose={() => setPatientSelectOpen(false)}
        onSelect={(id) => {
          setPatientSelectOpen(false);
          router.push(`/patients/card?id=${id}`);
        }}
      />
    </div>
  );
}
