import { useId, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in MB
  currentImageUrl?: string | null;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  accept = "image/*",
  maxSize = 5,
  currentImageUrl,
  className,
  disabled = false,
}: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    currentImageUrl || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  function handleFileChange(file: File | null) {
    if (!file) {
      setPreview(null);
      onFileSelect(null);
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onFileSelect(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileChange(files[0]);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function clearFile() {
    setPreview(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={inputId}>Logo</Label>
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center transition-colors",
          dragOver && !disabled
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25",
          disabled && "opacity-50 cursor-not-allowed",
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          <div className="space-y-2">
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Logo preview"
                className="max-w-full max-h-32 object-contain rounded"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={clearFile}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">
                Drag & drop a logo image here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                Max size: {maxSize}MB
              </p>
            </div>
          </div>
        )}

        <Input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept={accept}
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          className="hidden"
          disabled={disabled}
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="mt-2"
          disabled={disabled}
        >
          <Upload className="h-4 w-4 mr-2" />
          {preview ? "Change Logo" : "Upload Logo"}
        </Button>
      </div>
    </div>
  );
}
