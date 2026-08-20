import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronsUpDown, X } from "lucide-react";

interface Option {
  id: string;
  name: string;
}

interface MultiSelectProps {
  options: Option[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string | undefined;
}

export function MultiSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search options...",
  emptyMessage = "No options found.",
  disabled = false,
  className,
}: MultiSelectProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={`w-full justify-between ${className || ""}`}
          disabled={disabled}
        >
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.map((optionId) => {
                const option = options.find((o) => o.id === optionId);
                return option ? (
                  <Badge key={optionId} variant="secondary" className="text-xs">
                    {option.name}
                    <span
                      className="ml-1 hover:text-red-600 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        const newValue = value.filter((id) => id !== optionId);
                        onValueChange(newValue);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ) : null;
              })}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  onSelect={() => {
                    const newValue = value.includes(option.id)
                      ? value.filter((id) => id !== option.id)
                      : [...value, option.id];
                    onValueChange(newValue);
                  }}
                >
                  <Checkbox
                    checked={value.includes(option.id)}
                    className="mr-2"
                  />
                  {option.name}
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
