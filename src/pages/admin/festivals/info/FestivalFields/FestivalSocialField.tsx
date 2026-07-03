import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink } from "lucide-react";
import { EditableField } from "./shared/EditableField";
import { EditContainer } from "./shared/EditContainer";
import { useFestivalInfoMutation } from "@/api/festival-info/useFestivalInfoMutation";

interface FestivalSocialFieldProps {
  festivalId: string;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
}

interface SocialFormData {
  facebookUrl: string;
  instagramUrl: string;
}

export function FestivalSocialField({
  festivalId,
  facebookUrl,
  instagramUrl,
}: FestivalSocialFieldProps) {
  const hasSocialLinks = facebookUrl || instagramUrl;

  return (
    <EditableField
      title="Social Media"
      renderEdit={({ onCancel, onSave }) => (
        <SocialFieldForm
          facebookUrl={facebookUrl}
          instagramUrl={instagramUrl}
          festivalId={festivalId}
          onCancel={onCancel}
          onSave={onSave}
        />
      )}
    >
      {hasSocialLinks ? (
        <div className="flex gap-2">
          {facebookUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer">
                Facebook
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
          {instagramUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                Instagram
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground italic">No social media links</p>
      )}
    </EditableField>
  );
}

function SocialFieldForm({
  facebookUrl,
  festivalId,
  instagramUrl,

  onCancel,
  onSave,
}: {
  festivalId: string;
  facebookUrl?: string | null;
  instagramUrl?: string | null;

  onCancel: () => void;
  onSave: () => void;
}) {
  const mutation = useFestivalInfoMutation(festivalId);

  const form = useForm<SocialFormData>({
    defaultValues: {
      facebookUrl: facebookUrl || "",
      instagramUrl: instagramUrl || "",
    },
  });

  const handleSubmit = form.handleSubmit(handleSave);

  return (
    <EditContainer
      onSave={handleSubmit}
      onCancel={onCancel}
      isLoading={mutation.isPending}
    >
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <label htmlFor="facebook-input" className="text-sm font-medium">
            Facebook URL
          </label>
          <Input
            {...form.register("facebookUrl")}
            placeholder="https://facebook.com/yourfestival"
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="instagram-input" className="text-sm font-medium">
            Instagram URL
          </label>
          <Input
            {...form.register("instagramUrl")}
            placeholder="https://instagram.com/yourfestival"
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
    </EditContainer>
  );

  function handleSave(data: SocialFormData) {
    mutation.mutate(
      {
        facebook_url: data.facebookUrl || null,
        instagram_url: data.instagramUrl || null,
      },
      { onSuccess: onSave },
    );
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
