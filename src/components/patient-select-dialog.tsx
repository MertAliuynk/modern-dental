"use client";

import { useEffect, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { API } from "@/lib/api";

type Branch = { branch_id: number; name: string };
type PatientRow = { patient_id: number; first_name: string; last_name: string; branch_name?: string };

const PAGE_SIZE = 20;

export function PatientSelectDialog({
  open,
  onClose,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (patientId: number) => void;
}) {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!open) return;
    fetch(`${API}/branch`)
      .then((res) => res.json())
      .then((data) => setBranches(data.success ? data.data : []));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const params = new URLSearchParams();
    params.append("limit", PAGE_SIZE.toString());
    params.append("offset", ((page - 1) * PAGE_SIZE).toString());
    if (search.trim() !== "") params.append("search", search.trim());
    if (selectedBranch !== "all") params.append("branch_id", selectedBranch);
    fetch(`${API}/patient?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setPatients(data.success ? data.data : []);
        setTotal(data.total || 0);
      });
  }, [open, search, page, selectedBranch]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Hasta Seç</DialogTitle>
          <DialogDescription>Kartını görüntülemek istediğiniz hastayı seçin.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row">
          <NativeSelect
            className="sm:w-44"
            value={selectedBranch}
            onChange={(e) => {
              setSelectedBranch(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Tüm Şubeler</option>
            {branches.map((b) => (
              <option key={b.branch_id} value={b.branch_id}>
                {b.name}
              </option>
            ))}
          </NativeSelect>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="İsme göre ara…"
              className="pl-8"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="-mx-1 max-h-80 overflow-y-auto">
          {patients.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Hasta bulunamadı</p>
          ) : (
            <div className="flex flex-col">
              {patients.map((p) => (
                <button
                  key={p.patient_id}
                  type="button"
                  onClick={() => onSelect(p.patient_id)}
                  className="flex items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <UserRound className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {p.first_name} {p.last_name}
                  </span>
                  {p.branch_name && (
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{p.branch_name}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t pt-3">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
            Önceki
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {page} / {pageCount}
          </span>
          <Button size="sm" variant="outline" disabled={page * PAGE_SIZE >= total} onClick={() => setPage(page + 1)}>
            Sonraki
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
