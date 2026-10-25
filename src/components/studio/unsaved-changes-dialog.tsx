"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

/**
 * Shown when the shopper tries to leave the studio with changes that are not
 * saved as a design. Three ways out, in the order they are least to most
 * destructive from the shopper's point of view: save, leave, stay.
 */
export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onSave,
  onLeave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onLeave: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>
            This design has changes you haven&rsquo;t saved yet. Save it first, leave anyway, or
            stay and keep editing.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant="ghost"
              onClick={onLeave}
              className="h-11 rounded-full px-5 text-[var(--muted)] ring-1 ring-[var(--hairline)] hover:text-[var(--ivory)]"
            >
              Leave
            </Button>
          </AlertDialogAction>
          <AlertDialogAction asChild>
            <Button
              type="button"
              onClick={onSave}
              className="h-11 rounded-full bg-[var(--ivory)] px-5 text-[var(--ink)] hover:bg-[var(--ivory)]/90"
            >
              Save design
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
