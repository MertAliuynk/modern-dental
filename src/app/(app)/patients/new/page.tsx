import { Suspense } from "react";
import { NewPatientClient } from "./new-patient-client";

export default function NewPatientPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-sm text-muted-foreground">Yükleniyor…</p>}>
      <NewPatientClient />
    </Suspense>
  );
}
