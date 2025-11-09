import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { importStages } from "@/services/csv/stageImporter";
import {
  importSets,
  importSetsWithConflictResolution,
} from "@/services/csv/setImporter";
import {
  parseStagesCSV,
  parseSetsCSV,
  extractArtistCandidatesFromSets,
  type SetImportData,
  type StageImportData,
} from "@/services/csv/csvParser";
import type { ImportResult } from "@/services/csv/types";
import { detectImportConflicts } from "@/services/csv/conflictDetector";
import { useArtistsQuery } from "@/hooks/queries/artists/useArtists";
import { ImportConflictResolver } from "@/pages/admin/festivals/CSVImportDialog/ImportConflictResolver/ImportConflictResolver";
import type {
  ImportConflict,
  ConflictResolution,
  ImportCandidate,
} from "@/services/csv/conflictDetector";

import { StagesTabContent } from "./StagesTabContent";
import { SetsTabContent } from "./SetsTabContent";
import { ImportProgress } from "./ImportProgress";
import { StagesPreviewTable } from "./StagesPreviewTable";
import { SetsPreviewTable } from "./SetsPreviewTable";

interface CSVImportDialogProps {
  editionId: string;
  children: React.ReactNode;
  defaultTab?: "stages" | "sets";
}

export function CSVImportDialog({
  editionId,
  children,
  defaultTab = "stages",
}: CSVImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [stagesFile, setStagesFile] = useState<File | null>(null);
  const [setsFile, setSetsFile] = useState<File | null>(null);
  const [timezone, setTimezone] = useState("Europe/Lisbon");
  const [progress, setProgress] = useState({ current: 0, total: 0, label: "" });

  // Preview state
  const [stagesPreview, setStagesPreview] = useState<StageImportData[]>([]);
  const [setsPreview, setSetsPreview] = useState<SetImportData[]>([]);

  // Conflict resolution state
  const [showConflictResolver, setShowConflictResolver] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    setsData: SetImportData[];
    conflicts: ImportConflict[];
    candidates: ImportCandidate[];
  } | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const artistsQuery = useArtistsQuery();

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
    type: "stages" | "sets",
  ) {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      try {
        const content = await readFileAsText(file);

        if (type === "stages") {
          const parsedStages = parseStagesCSV(content);
          setStagesFile(file);
          setStagesPreview(parsedStages);
        } else {
          const parsedSets = parseSetsCSV(content);
          setSetsFile(file);
          setSetsPreview(parsedSets);
        }
      } catch (error) {
        toast({
          title: "Failed to parse CSV",
          description:
            error instanceof Error ? error.message : "Invalid CSV format",
          variant: "destructive",
        });
        if (type === "stages") {
          setStagesFile(null);
          setStagesPreview([]);
        } else {
          setSetsFile(null);
          setSetsPreview([]);
        }
      }
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  }

  function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  async function handleImport() {
    if (!stagesFile && !setsFile) {
      toast({
        title: "No files selected",
        description: "Please select at least one CSV file to import",
        variant: "destructive",
      });
      return;
    }

    if (!artistsQuery.data) {
      toast({
        title: "Artists data not loaded",
        description: "Please wait for artists data to load",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    const results: ImportResult[] = [];

    try {
      // Import stages first (no conflict detection needed)
      if (stagesFile) {
        setProgress({ current: 0, total: 0, label: "Importing stages..." });
        const stagesContent = await readFileAsText(stagesFile);
        const stagesData = parseStagesCSV(stagesContent);

        const stagesResult = await importStages(
          stagesData,
          editionId,
          (current, total) => {
            setProgress({
              current,
              total,
              label: `Importing stages (${current}/${total})...`,
            });
          },
        );
        results.push(stagesResult);
      }

      // Check for conflicts in sets data
      if (setsFile) {
        setProgress({
          current: 0,
          total: 0,
          label: "Analyzing sets for conflicts...",
        });
        const setsContent = await readFileAsText(setsFile);
        const setsData = parseSetsCSV(setsContent);

        // Extract artist candidates from CSV
        const candidates = extractArtistCandidatesFromSets(setsData);
        const conflicts = detectImportConflicts(candidates, artistsQuery.data);

        if (conflicts.length > 0) {
          // Show conflict resolver
          setPendingImport({
            setsData,
            conflicts,
            candidates,
          });
          setShowConflictResolver(true);
          setIsImporting(false);
          return;
        } else {
          // No conflicts, proceed with import
          const setsResult = await importSets(
            setsData,
            editionId,
            timezone,
            (current, total) => {
              setProgress({
                current,
                total,
                label: `Importing sets (${current}/${total})...`,
              });
            },
          );
          results.push(setsResult);
        }
      }

      // Show results
      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      if (successCount > 0 && failureCount === 0) {
        toast({
          title: "Import successful",
          description: results.map((r) => r.message).join(". "),
        });

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["stages"] });
        queryClient.invalidateQueries({ queryKey: ["sets"] });
        queryClient.invalidateQueries({ queryKey: ["artists"] });

        // Reset form
        setStagesFile(null);
        setSetsFile(null);
        setStagesPreview([]);
        setSetsPreview([]);
        setProgress({ current: 0, total: 0, label: "" });
        setIsOpen(false);
      } else {
        toast({
          title: "Import completed with issues",
          description: results.map((r) => r.message).join(". "),
          variant: failureCount > 0 ? "destructive" : "default",
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setProgress({ current: 0, total: 0, label: "" });
    }
  }

  async function handleResolveConflicts(
    resolutions: Map<number, ConflictResolution>,
    candidatesWithoutConflicts: ImportCandidate[],
  ) {
    if (!pendingImport) return;

    setIsImporting(true);
    setShowConflictResolver(false);

    try {
      const setsResult = await importSetsWithConflictResolution(
        pendingImport.setsData,
        editionId,
        resolutions,
        pendingImport.conflicts,
        candidatesWithoutConflicts,
        timezone,
        (current, total) => {
          setProgress({
            current,
            total,
            label: `Importing sets (${current}/${total})...`,
          });
        },
      );

      if (setsResult.success) {
        toast({
          title: "Import successful",
          description: setsResult.message,
        });

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["stages"] });
        queryClient.invalidateQueries({ queryKey: ["sets"] });
        queryClient.invalidateQueries({ queryKey: ["artists"] });

        // Reset form
        setStagesFile(null);
        setSetsFile(null);
        setStagesPreview([]);
        setSetsPreview([]);
        setProgress({ current: 0, total: 0, label: "" });
        setPendingImport(null);
        setIsOpen(false);
      } else {
        toast({
          title: "Import failed",
          description: setsResult.message,
          variant: "destructive",
        });
        console.error("Import failed:", setsResult.message, setsResult.errors);
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
      setProgress({ current: 0, total: 0, label: "" });
    }
  }

  function handleCancelConflictResolution() {
    setShowConflictResolver(false);
    setPendingImport(null);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import CSV Data</DialogTitle>
          <DialogDescription>
            Upload CSV files to import stages and sets for this festival
            edition.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stages">Stages</TabsTrigger>
            <TabsTrigger value="sets">Sets</TabsTrigger>
          </TabsList>

          <TabsContent value="stages" className="space-y-4">
            <StagesTabContent
              stagesFile={stagesFile}
              onStagesFileChange={(e) => handleFileChange(e, "stages")}
            />
            {stagesPreview.length > 0 && (
              <StagesPreviewTable stages={stagesPreview} />
            )}
          </TabsContent>

          <TabsContent value="sets" className="space-y-4">
            <SetsTabContent
              setsFile={setsFile}
              timezone={timezone}
              onSetsFileChange={(e) => handleFileChange(e, "sets")}
              onTimezoneChange={setTimezone}
            />
            {setsPreview.length > 0 && (
              <SetsPreviewTable sets={setsPreview} timezone={timezone} />
            )}
          </TabsContent>
        </Tabs>

        <ImportProgress progress={progress} isImporting={isImporting} />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || (!stagesFile && !setsFile)}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {progress.label || "Importing..."}
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import
              </>
            )}
          </Button>
        </div>
      </DialogContent>

      {showConflictResolver && pendingImport && (
        <ImportConflictResolver
          conflicts={pendingImport.conflicts}
          candidatesWithoutConflicts={pendingImport.candidates.filter(
            (candidate) =>
              !pendingImport.conflicts.some(
                (conflict) => conflict.candidate === candidate,
              ),
          )}
          onResolve={handleResolveConflicts}
          onCancel={handleCancelConflictResolution}
          isProcessing={isImporting}
        />
      )}
    </Dialog>
  );
}
