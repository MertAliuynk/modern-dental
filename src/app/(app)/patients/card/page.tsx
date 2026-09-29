import { Suspense } from "react";
import { PatientCardClient } from "./patient-card-client";

export default function PatientCardPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-sm text-muted-foreground">Yükleniyor…</p>}>
      <PatientCardClient />
    </Suspense>
  );
}
