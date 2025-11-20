import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Copy, ArrowLeft, Zap } from "lucide-react";
import { useDuplicateArtistsQuery } from "@/hooks/queries/artists/useDuplicateArtists";
import { DuplicateGroupCard } from "./DuplicateGroupCard";
import { BulkMergeDialog } from "./BulkMergeDialog";
import { Link } from "@tanstack/react-router";

export function DuplicateArtistsPage() {
  const duplicatesQuery = useDuplicateArtistsQuery();
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [showBulkMerge, setShowBulkMerge] = useState(false);

  if (duplicatesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading duplicate artists...</p>
        </div>
      </div>
    );
  }

  if (duplicatesQuery.error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load duplicate artists</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => duplicatesQuery.refetch()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const duplicateGroups = duplicatesQuery.data || [];
  const totalDuplicates = duplicateGroups.reduce(
    (sum, group) => sum + group.count,
    0,
  );
  const totalGroups = duplicateGroups.length;

  function handleGroupSelect(groupName: string, isSelected: boolean) {
    const newSelected = new Set(selectedGroups);
    if (isSelected) {
      newSelected.add(groupName);
    } else {
      newSelected.delete(groupName);
    }
    setSelectedGroups(newSelected);
  }

  function handleSelectAll() {
    if (selectedGroups.size === duplicateGroups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(duplicateGroups.map((group) => group.name)));
    }
  }

  function getSelectedGroupsData() {
    return duplicateGroups.filter((group) => selectedGroups.has(group.name));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/admin/artists">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Copy className="h-5 w-5 text-orange-600" />
              <span>Duplicate Artists</span>
            </div>
            <div className="flex items-center gap-3">
              {selectedGroups.size > 0 && (
                <>
                  <Badge variant="secondary">
                    {selectedGroups.size} selected
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => setShowBulkMerge(true)}
                    className="bg-orange-600 hover:bg-orange-700 flex items-center gap-1"
                  >
                    <Zap className="h-3 w-3" />
                    Bulk Merge
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                {selectedGroups.size === duplicateGroups.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {duplicateGroups.length === 0 ? (
            <div className="text-center py-8">
              <Copy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No Duplicates Found
              </h3>
              <p className="text-muted-foreground">
                All artists have unique names. Great job keeping your data
                clean!
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-800">
                    Duplicates Found
                  </span>
                </div>
                <p className="text-sm text-orange-700">
                  Found <strong>{totalDuplicates} total artist entries</strong>{" "}
                  across <strong>{totalGroups} duplicate groups</strong>. Review
                  each group carefully before merging or deleting.
                </p>
              </div>

              <div className="space-y-4">
                {duplicateGroups.map((group) => (
                  <DuplicateGroupCard
                    key={group.name}
                    group={group}
                    isSelected={selectedGroups.has(group.name)}
                    onSelect={(isSelected) =>
                      handleGroupSelect(group.name, isSelected)
                    }
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showBulkMerge && (
        <BulkMergeDialog
          selectedGroups={getSelectedGroupsData()}
          onClose={() => {
            setShowBulkMerge(false);
            setSelectedGroups(new Set());
          }}
        />
      )}
    </div>
  );
}
