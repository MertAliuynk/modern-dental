"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Pending = { title: string; text: string; confirmLabel?: string; destructive?: boolean; run: () => void | Promise<void> };

/** `window.confirm` yerine: `ask({...})` çağrılır, dialog JSX'e yerleştirilir. */
export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);
  const dialog = (
    <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pending?.title}</DialogTitle>
          <DialogDescription>{pending?.text}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setPending(null)}>
            Vazgeç
          </Button>
          <Button
            variant={pending?.destructive ? "destructive" : "default"}
            onClick={async () => {
              const p = pending;
              setPending(null);
              await p?.run();
            }}
          >
            {pending?.confirmLabel ?? "Onayla"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
  return { ask: setPending, dialog };
}
