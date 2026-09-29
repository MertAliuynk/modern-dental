"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { API } from "@/lib/api";

type Branch = { branch_id: number; name: string };
type PatientRow = { patient_id: number; first_name: string; last_name: string; branch_name?: string };

const PAGE_SIZE = 15;

export function PatientSearchCard() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch(`${API}/branch`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setBranches(data.data);
      });
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    params.append("limit", PAGE_SIZE.toString());
    params.append("offset", ((page - 1) * PAGE_SIZE).toString());
    if (search.trim() !== "") params.append("search", search.trim());
    if (selectedBranch) params.append("branch_id", selectedBranch);
    fetch(`${API}/patient?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setPatients(data.data);
          setTotal(data.total || 0);
        } else {
          setPatients([]);
          setTotal(0);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Hasta verileri alınamadı");
        setLoading(false);
      });
  }, [search, page, selectedBranch]);

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle className="text-base">Hasta Ara</CardTitle>
        <CardDescription>İsim veya soyisimle arayın, şubeye göre süzün.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Hasta adı veya soyadı ara…"
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <NativeSelect
          value={selectedBranch}
          onChange={(e) => {
            setSelectedBranch(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tüm Şubeler</option>
          {branches.map((b) => (
            <option key={b.branch_id} value={b.branch_id}>
              {b.name}
            </option>
          ))}
        </NativeSelect>

        <div className="min-h-64 max-h-96 overflow-y-auto">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Yükleniyor…</p>
          ) : error ? (
            <p className="py-10 text-center text-sm text-destructive">{error}</p>
          ) : patients.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Hasta bulunamadı</p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {patients.map((p) => (
                <Link
                  key={p.patient_id}
                  href={`/patients/card?id=${p.patient_id}`}
                  className="flex items-center justify-between gap-2 rounded-md px-1 py-2.5 text-sm hover:bg-accent"
                >
                  <span className="min-w-0 truncate font-medium">
                    {p.first_name} {p.last_name}
                  </span>
                  {p.branch_name && <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{p.branch_name}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <Button size="sm" variant="outline" disabled={page === 1 || loading} onClick={() => setPage(page - 1)}>
            Önceki
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {page} / {Math.max(1, Math.ceil(total / PAGE_SIZE))}
          </span>
          <Button size="sm" variant="outline" disabled={page * PAGE_SIZE >= total || loading} onClick={() => setPage(page + 1)}>
            Sonraki
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
