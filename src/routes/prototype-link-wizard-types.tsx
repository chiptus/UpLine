// PROTOTYPE — throwaway route for wayfinder #422. Mounts the LinkWizard
// missing-type step variants outside the auth-gated admin area so they're
// easy to flip through. Visit /prototype-link-wizard-types?variant=A|B|C.
// Remove after decision.
import { createFileRoute } from "@tanstack/react-router";
import {
  LinkWizardTypeStepPrototype,
  usePrototypeVariant,
} from "@/pages/admin/festivals/LinkWizard/LinkWizardTypeStepPrototype";

export const Route = createFileRoute("/prototype-link-wizard-types")({
  component: PrototypeLinkWizardTypes,
});

function PrototypeLinkWizardTypes() {
  const variant = usePrototypeVariant();
  return (
    <div className="mx-auto max-w-3xl p-6">
      <LinkWizardTypeStepPrototype variant={variant ?? "A"} />
    </div>
  );
}
