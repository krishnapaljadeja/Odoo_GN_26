import React from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const CloseAuditDialog = ({ open, onOpenChange, cycle, discrepancies, onConfirm }) => {
  if (!cycle) return null;

  const missing = discrepancies.filter((item) => item.result === "MISSING");
  const damaged = discrepancies.filter((item) => item.result === "DAMAGED");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Close audit cycle</DialogTitle>
          <DialogDescription>Closing locks the checklist and applies discrepancy status updates.</DialogDescription>
        </DialogHeader>

        <div className="rounded-md border border-amber-800 bg-amber-950/30 p-3 text-sm text-amber-200">
          <div className="flex items-center gap-2 font-medium">
            <AlertTriangle size={16} />
            Status changes on close
          </div>
          <ul className="mt-2 grid gap-1 text-xs">
            <li>{missing.length} missing asset(s) will be marked Lost.</li>
            <li>{damaged.length} damaged asset(s) will be marked Damaged.</li>
          </ul>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Close cycle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CloseAuditDialog;
