import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SelectWithOtherProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  className?: string;
  inputPlaceholder?: string;
}

export function SelectWithOther({
  value,
  onValueChange,
  placeholder = "Select...",
  options,
  disabled = false,
  className,
  inputPlaceholder = "Enter custom value..."
}: SelectWithOtherProps) {
  const [isOther, setIsOther] = useState(false);
  const [customValue, setCustomValue] = useState("");

  // Check if current value is one of the predefined options or if it was custom
  useEffect(() => {
    const isPredefined = options.some(opt => opt.value === value);
    if (value && !isPredefined && value !== "__other__" && value !== "other") {
      setIsOther(true);
      setCustomValue(value);
    } else if (value === "other" || value === "__other__") {
      setIsOther(true);
    }
  }, [value, options]);

  const handleSelectChange = (newValue: string) => {
    if (newValue === "__other__" || newValue === "other") {
      setIsOther(true);
      setCustomValue("");
      // Don't call onValueChange yet - wait for user input
    } else {
      setIsOther(false);
      setCustomValue("");
      onValueChange(newValue);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomValue(val);
    if (val.trim()) {
      onValueChange(val);
    }
  };

  const handleCancelOther = () => {
    setIsOther(false);
    setCustomValue("");
    onValueChange("");
  };

  if (isOther) {
    return (
      <div className="flex gap-2 items-center">
        <Input
          value={customValue}
          onChange={handleCustomChange}
          placeholder={inputPlaceholder}
          disabled={disabled}
          className={cn("flex-1 bg-background", className)}
          autoFocus
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleCancelOther}
          className="h-9 w-9 shrink-0"
          disabled={disabled}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleSelectChange} disabled={disabled}>
      <SelectTrigger className={cn("bg-background", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-popover z-50">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        <SelectItem value="__other__">Other (specify)</SelectItem>
      </SelectContent>
    </Select>
  );
}
