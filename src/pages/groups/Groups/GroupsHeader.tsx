import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function GroupsHeader({ onCreate }: { onCreate: () => void }) {
  return (
    <div>
      <TopBar showBackButton backLabel="Back to Artists" />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight md:block">
          My Groups
        </h2>
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
