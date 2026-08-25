import { useState } from "react";
import { Input } from "@/components/ui/input";

interface UrlCellProps {
  value: string | null;
  placeholder?: string;
  onSave: (value: string | null) => void;
}

export function UrlCell({ value, placeholder, onSave }: UrlCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  function handleEdit() {
    setEditValue(value || "");
    setIsEditing(true);
  }

  async function handleSave() {
    const newValue = editValue.trim() || null;

    // Only save if value actually changed
    if (newValue === value) {
      setIsEditing(false);
      return;
    }

    // Validate URL if not empty
    if (newValue && !isValidUrl(newValue)) {
      console.error("Invalid URL format");
      return;
    }

    try {
      onSave(newValue);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save:", error);
    }
  }

  function isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  function handleCancel() {
    setIsEditing(false);
    setEditValue("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  }

  if (isEditing) {
    return (
      <div className="min-w-32">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="text-sm"
          autoFocus
        />
      </div>
    );
  }

  const displayValue = value ? (
    <a
      href={value}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {value.length > 40 ? `${value.substring(0, 37)}...` : value}
    </a>
  ) : null;

  return (
    <div
      className="cursor-pointer hover:bg-gray-50 p-1 rounded min-h-6 text-sm"
      onClick={handleEdit}
      title="Click to edit"
    >
      {displayValue || (
        <span className="text-muted-foreground italic">
          {placeholder || "Click to add..."}
        </span>
      )}
    </div>
  );
}
