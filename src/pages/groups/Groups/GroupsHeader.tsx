import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function GroupsHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div>
      <AppHeader showBackButton backLabel="Back to Artists" title="My Groups" />
      <div className="flex justify-between items-center mb-6">
        <div />
        <Button
          onClick={onCreate}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </div>
    </div>
  );
}
