// PROTOTYPE — throwaway route for wayfinder #399. Mounts the set-form dialog
// variants outside the auth-gated admin area so they're easy to flip through.
// Visit /prototype-set-form?variant=A|B|C. Remove after decision.
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  SetFormDialogPrototype,
  usePrototypeVariant,
} from "@/pages/admin/festivals/SetFormDialogPrototype";

export const Route = createFileRoute("/prototype-set-form")({
  component: PrototypeSetForm,
});

function PrototypeSetForm() {
  const variant = usePrototypeVariant();
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="min-h-screen flex items-center justify-center">
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)}>Reopen dialog</Button>
      )}
      <SetFormDialogPrototype
        variant={variant ?? "A"}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        editingSet={null}
      />
    </div>
  );
}
