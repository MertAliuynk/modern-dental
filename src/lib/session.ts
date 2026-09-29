"use client";

import { useEffect, useState } from "react";

// Eski frontend oturum bilgisini localStorage'da bu anahtarlarla tutuyordu;
// aynı anahtarlar korunur ki iki site aynı tarayıcıda sorunsuz çalışsın.
export const SESSION_KEYS = ["token", "user", "role", "branch", "name", "branchId", "selectedBranchId"] as const;

export type Role = "admin" | "doctor" | "receptionist" | "branch_manager" | string;

export type Session = {
  ready: boolean;
  token: string;
  role: Role;
  branchName: string;
  userName: string;
  /** selectedBranchId varsa o, yoksa kullanıcının kendi şubesi. */
  branchId: number;
  user: Record<string, unknown> | null;
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Yönetici",
  doctor: "Doktor",
  receptionist: "Bankocu",
  branch_manager: "Şube Müdürü",
};

export function roleLabel(role: string) {
  return ROLE_LABELS[role] ?? role;
}

const EMPTY_SESSION: Session = { ready: false, token: "", role: "", branchName: "", userName: "", branchId: 0, user: null };

export function readSession(): Session {
  if (typeof window === "undefined") return EMPTY_SESSION;
  let user: Record<string, unknown> | null = null;
  try {
    const raw = localStorage.getItem("user");
    user = raw ? JSON.parse(raw) : null;
  } catch {}
  const selected = localStorage.getItem("selectedBranchId");
  const own = localStorage.getItem("branchId");
  return {
    ready: true,
    token: localStorage.getItem("token") || "",
    role: localStorage.getItem("role") || "",
    branchName: localStorage.getItem("branch") || "",
    userName: localStorage.getItem("name") || "",
    branchId: selected ? parseInt(selected) : own ? parseInt(own) : 0,
    user,
  };
}

export function useSession(): Session {
  // Sunucuda localStorage yok; ilk render boş oturumla yapılır, gerçek değer effect'te okunur.
  const [session, setSession] = useState<Session>(EMPTY_SESSION);
  useEffect(() => {
    const update = () => setSession(readSession());
    update();
    window.addEventListener("branchChanged", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("branchChanged", update);
      window.removeEventListener("storage", update);
    };
  }, []);
  return session;
}

export function clearSession() {
  for (const k of ["token", "role", "branch", "name", "branchId", "selectedBranchId"]) localStorage.removeItem(k);
}
