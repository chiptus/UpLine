import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { EditableField } from "./shared/EditableField";
import { EditContainer } from "./shared/EditContainer";
import { CustomLink } from "@/api/custom-links/types";
import { useBulkUpdateCustomLinksMutation } from "@/api/custom-links/useCustomLinksMutation";

interface FestivalLinksFieldProps {
  festivalId: string;
  customLinks: CustomLink[];
}

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
  display_order?: number;
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
  const [editingLinks, setEditingLinks] = useState<EditingLink[]>([]);
  const mutation = useBulkUpdateCustomLinksMutation();

  function handleEdit() {
    setEditingLinks(
      customLinks.length > 0
        ? customLinks.map((link) => ({
            id: link.id,
            title: link.title,
            url: link.url,
            display_order: link.display_order || undefined,
          }))
        : [{ title: "", url: "", display_order: 0 }],
    );
  }

  function addCustomLink() {
    setEditingLinks([
      ...editingLinks,
      { title: "", url: "", display_order: editingLinks.length },
    ]);
  }

  function removeCustomLink(index: number) {
    setEditingLinks(editingLinks.filter((_, i) => i !== index));
  }

  function updateCustomLink(
    index: number,
    field: "title" | "url",
    value: string,
  ) {
    const updatedLinks = [...editingLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setEditingLinks(updatedLinks);
  }

  function handleSave() {
    const validLinks = editingLinks
      .filter((link) => link.title.trim() && link.url.trim())
      .map((link, index) => ({
        ...link,
        display_order: index,
      }));

    mutation.mutate({ festivalId, links: validLinks }, { onSuccess: onSave });
  }

  if (editingLinks.length === 0) {
    handleEdit();
  }

  return (
    <EditContainer
      onSave={handleSave}
      onCancel={onCancel}
      isLoading={mutation.isPending}
      helpText="Only links with both title and URL filled will be saved"
    >
      <div className="space-y-4">
        {editingLinks.map((link, index) => (
          <div
            key={link.id || `new-${index}`}
            className="flex items-center gap-2 p-3 border rounded-lg bg-background"
          >
            <div className="grid grid-cols-2 gap-2 flex-1">
              <Input
                placeholder="Link title (e.g., Tickets)"
                value={link.title}
                onChange={(e) =>
                  updateCustomLink(index, "title", e.target.value)
                }
              />
              <Input
                placeholder="URL (e.g., https://...)"
                value={link.url}
                onChange={(e) => updateCustomLink(index, "url", e.target.value)}
              />
            </div>
            <Button
              onClick={() => removeCustomLink(index)}
              variant="outline"
              size="sm"
              disabled={editingLinks.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Button onClick={addCustomLink} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Link
        </Button>
      </div>
    </EditContainer>
  );
}
