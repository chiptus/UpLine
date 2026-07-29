import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { EditableField } from "./shared/EditableField";
import { EditContainer } from "./shared/EditContainer";
import { CustomLink, LinkType } from "@/api/custom-links/types";
import { useBulkUpdateCustomLinksMutation } from "@/api/custom-links/useCustomLinksMutation";

interface FestivalLinksFieldProps {
  festivalId: string;
  customLinks: CustomLink[];
}

const LINK_TYPE_LABELS: Record<LinkType, string> = {
  website: "Website",
  tickets: "Tickets",
  custom: "Custom",
};

export function FestivalLinksField({
  festivalId,
  customLinks,
}: FestivalLinksFieldProps) {
  return (
    <EditableField
      title="Custom Links"
      renderEdit={({ onCancel, onSave }) => (
        <LinksFieldForm
          customLinks={customLinks}
          festivalId={festivalId}
          onCancel={onCancel}
          onSave={onSave}
        />
      )}
    >
      {customLinks.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {customLinks.map((link) => (
            <Button key={link.id} variant="outline" size="sm" asChild>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                {link.title}
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground italic">No custom links</p>
      )}
    </EditableField>
  );
}

interface EditingLink {
  id?: string;
  title: string;
  url: string;
  link_type: LinkType;
}

interface LinksFormData {
  links: EditingLink[];
}

function LinksFieldForm({
  customLinks,
  festivalId,
  onCancel,
  onSave,
}: {
  festivalId: string;
  customLinks: CustomLink[];
  onCancel: () => void;
  onSave: () => void;
}) {
  const mutation = useBulkUpdateCustomLinksMutation();

  const form = useForm<LinksFormData>({
    defaultValues: {
      links:
        customLinks.length > 0
          ? customLinks.map((link) => ({
              id: link.id,
              title: link.title,
              url: link.url,
              link_type: link.link_type,
            }))
          : [{ title: "", url: "", link_type: "custom" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "links",
  });

  const handleSubmit = form.handleSubmit(handleSave);

  return (
    <EditContainer
      onSave={handleSubmit}
      onCancel={onCancel}
      isLoading={mutation.isPending}
      helpText="Only links with both title and URL filled will be saved"
    >
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-center gap-2 p-3 border rounded-lg bg-background"
          >
            <div className="grid grid-cols-3 gap-2 flex-1">
              <Input
                placeholder="Link title (e.g., Tickets)"
                {...form.register(`links.${index}.title`)}
              />
              <Input
                placeholder="URL (e.g., https://...)"
                {...form.register(`links.${index}.url`)}
              />
              <Select
                value={form.watch(`links.${index}.link_type`)}
                onValueChange={(value: LinkType) =>
                  form.setValue(`links.${index}.link_type`, value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LINK_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => remove(index)}
              variant="outline"
              size="sm"
              disabled={fields.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button
          onClick={() => append({ title: "", url: "", link_type: "custom" })}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Link
        </Button>
      </div>
    </EditContainer>
  );

  function handleSave(data: LinksFormData) {
    const validLinks = data.links
      .filter((link) => link.title.trim() && link.url.trim())
      .map((link, index) => ({
        ...link,
        display_order: index,
      }));

    mutation.mutate({ festivalId, links: validLinks }, { onSuccess: onSave });
  }
}
