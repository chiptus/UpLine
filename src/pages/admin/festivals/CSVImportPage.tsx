import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearch } from "@tanstack/react-router";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Loader2, ArrowLeft } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { importStages } from "@/services/csv/stageImporter";
import {
  importSetsWithMappings,
  type ArtistMapping,
} from "@/services/csv/setImporter";
import {
  parseStagesCSV,
  parseSetsCSV,
  type SetImportData,
  type StageImportData,
} from "@/services/csv/csvParser";
import type { ImportResult } from "@/services/csv/types";
import { useArtistsQuery } from "@/hooks/queries/artists/useArtists";
import { StagesTabContent } from "@/pages/admin/festivals/CSVImportDialog/StagesTabContent";
import { SetsTabContent } from "@/pages/admin/festivals/CSVImportDialog/SetsTabContent";
import { ImportProgress } from "@/pages/admin/festivals/CSVImportDialog/ImportProgress";
import { ImportResults } from "@/pages/admin/festivals/CSVImportDialog/ImportResults";
import { StagesPreviewTable } from "@/pages/admin/festivals/CSVImportDialog/StagesPreviewTable";
import {
  SetsPreviewTable,
  type ArtistSelection,
  type SetSelection,
} from "@/pages/admin/festivals/CSVImportDialog/SetsPreviewTable";
import { validateSetSelections } from "@/services/csv/setSelectionValidator";
import { useFestivalsQuery } from "@/hooks/queries/festivals/useFestivals";
import { useFestivalEditionsForFestivalQuery } from "@/hooks/queries/festivals/editions/useFestivalEditionsForFestival";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function CSVImportPage() {
  const { festivalId: urlFestivalId, editionId: urlEditionId } = useParams({
    from: "/admin/festivals/$festivalId/$editionId/import",
  });
  const navigate = useNavigate();
  const search = useSearch({
    from: "/admin/festivals/$festivalId/$editionId/import",
  });
  const defaultTab = search.tab || "stages";

  const [selectedFestivalId, setSelectedFestivalId] = useState<string>(
    urlFestivalId || "",
  );
  const [selectedEditionId, setSelectedEditionId] = useState<string>(
    urlEditionId || "",
  );
  const [isImporting, setIsImporting] = useState(false);
  const [stagesFile, setStagesFile] = useState<File | null>(null);
  const [setsFile, setSetsFile] = useState<File | null>(null);
  const [timezone, setTimezone] = useState(getUserTimezone());
  const [progress, setProgress] = useState({ current: 0, total: 0, label: "" });
  const [importResults, setImportResults] = useState<ImportResult[]>([]);

  const [stagesPreview, setStagesPreview] = useState<StageImportData[]>([]);
  const [setsPreview, setSetsPreview] = useState<SetImportData[]>([]);
  const [artistSelections, setArtistSelections] = useState<
    Map<number, ArtistSelection[]>
  >(new Map());
  const [setSelections, setSetSelections] = useState<Map<number, SetSelection>>(
    new Map(),
  );

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const artistsQuery = useArtistsQuery();
  const festivalsQuery = useFestivalsQuery({ all: true });
  const editionsQuery = useFestivalEditionsForFestivalQuery(
    selectedFestivalId,
    { all: true },
  );

  useEffect(() => {
    if (urlFestivalId) {
      setSelectedFestivalId(urlFestivalId);
    }
  }, [urlFestivalId]);

  useEffect(() => {
    if (urlEditionId) {
      setSelectedEditionId(urlEditionId);
    }
  }, [urlEditionId]);

  function handleFestivalChange(festivalId: string) {
    setSelectedFestivalId(festivalId);
    setSelectedEditionId("");
    // Don't navigate with empty editionId - just update state
    // User will select an edition which will then trigger navigation
  }

  function handleEditionChange(editionId: string) {
    setSelectedEditionId(editionId);
    if (selectedFestivalId && editionId) {
      navigate({
        to: "/admin/festivals/$festivalId/$editionId/import",
        params: { festivalId: selectedFestivalId, editionId },
        search: (prev) => ({ ...prev }),
        replace: true,
      });
    }
  }

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

    if (!selectedEditionId) {
      toast({
        title: "No edition selected",
        description: "Please select a festival edition",
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

    if (setsFile && setSelections.size > 0) {
      const validationErrors = validateSetSelections(setSelections);
      if (validationErrors.length > 0) {
        toast({
          title: "Set selection conflicts",
          description: validationErrors[0].message,
          variant: "destructive",
        });
        return;
      }
    }

    setIsImporting(true);
    setImportResults([]);
    const results: ImportResult[] = [];

    try {
      if (stagesFile) {
        setProgress({ current: 0, total: 0, label: "Importing stages..." });
        const stagesContent = await readFileAsText(stagesFile);
        const stagesData = parseStagesCSV(stagesContent);

        const stagesResult = await importStages(
          stagesData,
          selectedEditionId,
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

      if (setsFile) {
        setProgress({
          current: 0,
          total: 0,
          label: "Importing sets...",
        });
        const setsContent = await readFileAsText(setsFile);
        const setsData = parseSetsCSV(setsContent);

        const artistMappings = new Map<number, ArtistMapping[]>();
        artistSelections.forEach((selections, index) => {
          artistMappings.set(
            index,
            selections.map((sel) => ({
              csvName: sel.csvName,
              artistId: sel.artistId,
              shouldCreate: sel.isCreating,
            })),
          );
        });

        const setsResult = await importSetsWithMappings(
          setsData,
          selectedEditionId,
          artistMappings,
          setSelections,
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

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;
      const allErrors = results.flatMap((r) => r.errors || []);

      setImportResults(results);

      if (successCount > 0 && failureCount === 0 && allErrors.length === 0) {
        toast({
          title: "Import successful",
          description: results.map((r) => r.message).join(". "),
        });

        queryClient.invalidateQueries({ queryKey: ["stages"] });
        queryClient.invalidateQueries({ queryKey: ["sets"] });
        queryClient.invalidateQueries({ queryKey: ["artists"] });

        setStagesFile(null);
        setSetsFile(null);
        setStagesPreview([]);
        setSetsPreview([]);
        setProgress({ current: 0, total: 0, label: "" });
        setImportResults([]);
      } else {
        toast({
          title: "Import completed with issues",
          description: `${results.map((r) => r.message).join(". ")}${allErrors.length > 0 ? ` See details below for ${allErrors.length} error${allErrors.length === 1 ? "" : "s"}.` : ""}`,
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

  const selectedFestival = festivalsQuery.data?.find(
    (f) => f.id === selectedFestivalId,
  );
  const selectedEdition = editionsQuery.data?.find(
    (e) => e.id === selectedEditionId,
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/admin/festivals" })}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Festivals
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import CSV Data</CardTitle>
          <CardDescription>
            Select a festival and edition, then upload CSV files to import
            stages and sets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Festival</label>
              <Select
                value={selectedFestivalId}
                onValueChange={handleFestivalChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a festival" />
                </SelectTrigger>
                <SelectContent>
                  {festivalsQuery.data?.map((festival) => (
                    <SelectItem key={festival.id} value={festival.id}>
                      {festival.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Edition</label>
              <Select
                value={selectedEditionId}
                onValueChange={handleEditionChange}
                disabled={!selectedFestivalId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an edition" />
                </SelectTrigger>
                <SelectContent>
                  {editionsQuery.data?.map((edition) => (
                    <SelectItem key={edition.id} value={edition.id}>
                      {edition.year}
                      {edition.name && ` - ${edition.name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedFestival && selectedEdition && (
            <div className="rounded-lg border p-4 bg-muted/50">
              <p className="text-sm">
                <span className="font-medium">Importing to:</span>{" "}
                {selectedFestival.name} {selectedEdition.year}
                {selectedEdition.name && ` - ${selectedEdition.name}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEditionId && (
        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stages">Stages</TabsTrigger>
                <TabsTrigger value="sets">Sets</TabsTrigger>
              </TabsList>

              <TabsContent value="stages" className="space-y-4 mt-4">
                <StagesTabContent
                  stagesFile={stagesFile}
                  onStagesFileChange={(e) => handleFileChange(e, "stages")}
                />
                {stagesPreview.length > 0 && (
                  <StagesPreviewTable stages={stagesPreview} />
                )}
              </TabsContent>

              <TabsContent value="sets" className="space-y-4 mt-4">
                <SetsTabContent
                  setsFile={setsFile}
                  timezone={timezone}
                  onSetsFileChange={(e) => handleFileChange(e, "sets")}
                  onTimezoneChange={setTimezone}
                />
                {setsPreview.length > 0 && selectedEditionId && (
                  <SetsPreviewTable
                    sets={setsPreview}
                    timezone={timezone}
                    editionId={selectedEditionId}
                    onArtistSelectionsChange={setArtistSelections}
                    onSetSelectionsChange={setSetSelections}
                  />
                )}
              </TabsContent>
            </Tabs>

            <ImportProgress progress={progress} isImporting={isImporting} />

            <ImportResults results={importResults} />

            <div className="flex justify-end gap-2 pt-4 mt-6 border-t">
              <Button
                onClick={handleImport}
                disabled={
                  isImporting ||
                  (!stagesFile && !setsFile) ||
                  !selectedEditionId
                }
                size="lg"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {progress.label || "Importing..."}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
