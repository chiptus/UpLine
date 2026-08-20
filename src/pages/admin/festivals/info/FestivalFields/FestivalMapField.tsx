import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import { EditableField } from "./shared/EditableField";
import { EditContainer } from "./shared/EditContainer";
import { useFestivalInfoMutation } from "@/api/festival-info/useFestivalInfoMutation";
import { useMapUpload } from "./shared/useMapUpload";

interface FestivalMapFieldProps {
  festivalId: string;
  mapImageUrl?: string | null | undefined;
}

interface MapFormData {
  mapImageUrl: string;
}

export function FestivalMapField({
  festivalId,
  mapImageUrl,
}: FestivalMapFieldProps) {
  return (
    <EditableField
      title="Festival Map"
      renderEdit={({ onCancel, onSave }) => (
        <MapFieldForm
          mapImageUrl={mapImageUrl}
          festivalId={festivalId}
          onCancel={onCancel}
          onSave={onSave}
        />
      )}
    >
      {mapImageUrl ? (
        <img
          src={mapImageUrl}
          alt="Festival map"
          className="max-w-md rounded-lg border"
        />
      ) : (
        <p className="text-muted-foreground italic">No map</p>
      )}
    </EditableField>
  );
}

function MapFieldForm({
  mapImageUrl,
  festivalId,
  onCancel,
  onSave,
}: {
  festivalId: string;
  mapImageUrl?: string | null | undefined;
  onCancel: () => void;
  onSave: () => void;
}) {
  const mutation = useFestivalInfoMutation(festivalId);
  const uploadMutation = useMapUpload({
    festivalId,
    onSuccess: (url) => {
      mutation.mutate({ map_image_url: url });
    },
  });

  const form = useForm<MapFormData>({
    defaultValues: {
      mapImageUrl: mapImageUrl || "",
    },
  });

  const handleSubmit = form.handleSubmit(handleSave);

  return (
    <EditContainer
      onSave={handleSubmit}
      onCancel={onCancel}
      isLoading={mutation.isPending || uploadMutation.isPending}
    >
      <div className="flex items-center gap-4">
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploadMutation.isPending}
        />
        {uploadMutation.isPending && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        <Upload className="h-4 w-4 text-gray-500" />
      </div>
      <Input
        {...form.register("mapImageUrl")}
        placeholder="Or enter image URL directly"
        onKeyDown={handleKeyDown}
      />
    </EditContainer>
  );

  function handleSave(data: MapFormData) {
    if (uploadMutation.isPending) {
      return;
    }
    mutation.mutate(
      { map_image_url: data.mapImageUrl || null },
      { onSuccess: onSave },
    );
  }

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadMutation.mutate(file);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      onCancel();
    }
  }
}
