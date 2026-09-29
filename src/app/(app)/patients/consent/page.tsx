import { Suspense } from "react";
import { ConsentClient } from "./consent-client";

export default function ConsentFormsPage() {
  return (
    <Suspense fallback={<p className="py-24 text-center text-sm text-muted-foreground">Yükleniyor…</p>}>
      <ConsentClient />
    </Suspense>
  );
}
