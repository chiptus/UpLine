import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";
import { Festival } from "@/api/festivals/types";
import { FestivalInfoDetails } from "./info/FestivalInfoDetails";

interface FestivalInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  festival: Festival | null;
}

export function FestivalInfoDialog({
  open,
  onOpenChange,
  festival,
}: FestivalInfoDialogProps) {
  if (!festival) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Festival Info
          </DialogTitle>
          <DialogDescription>
            Manage the map, description, socials, and links shown on "
            {festival.name}"'s public Info tab.
          </DialogDescription>
        </DialogHeader>
        <FestivalInfoDetails festivalId={festival.id} />
      </DialogContent>
    </Dialog>
  );
}
