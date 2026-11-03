import type { RefObject } from "react";
import { FestivalEdition } from "@/api/editions/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateEditionForm } from "./CreateEditionForm";
import { EditEditionForm } from "./EditEditionForm";

interface EditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  festivalId: string;
  editingEdition: FestivalEdition | null;
  returnFocusRef: RefObject<HTMLElement | null>;
}

export function EditionDialog({
  open,
  onOpenChange,
  festivalId,
  editingEdition,
  returnFocusRef,
}: EditionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The opener lives outside the dialog root, so Radix has no trigger to refocus. */}
      <DialogContent onCloseAutoFocus={restoreFocus}>
        <DialogHeader>
          <DialogTitle>
            {editingEdition
              ? "Edit Festival Edition"
              : "Create New Festival Edition"}
          </DialogTitle>
          <DialogDescription>
            {editingEdition
              ? "Update edition information including name, dates, and visibility settings."
              : "Create a new festival edition with dates and publish settings."}
          </DialogDescription>
        </DialogHeader>
        {/* Keyed so switching editions remounts the form with fresh defaults. */}
        {editingEdition ? (
          <EditEditionForm
            key={editingEdition.id}
            edition={editingEdition}
            festivalId={festivalId}
            onDone={close}
          />
        ) : (
          <CreateEditionForm festivalId={festivalId} onDone={close} />
        )}
      </DialogContent>
    </Dialog>
  );

  function close() {
    onOpenChange(false);
  }

  function restoreFocus(event: Event) {
    event.preventDefault();
    returnFocusRef.current?.focus();
  }
}
