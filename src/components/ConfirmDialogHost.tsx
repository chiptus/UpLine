import { ConfirmDialog } from "@/components/ConfirmDialog";
import { respondConfirm, useConfirm } from "@/hooks/use-confirm";

export function ConfirmDialogHost() {
  const { request } = useConfirm();

  return (
    <ConfirmDialog
      open={request !== null}
      onOpenChange={(open) => !open && respondConfirm(false)}
      title={request?.title ?? ""}
      description={request?.description ?? ""}
      confirmLabel={request?.confirmLabel ?? ""}
      onConfirm={() => respondConfirm(true)}
    />
  );
}
