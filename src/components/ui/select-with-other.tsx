import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

  // Check if current value is one of the predefined options
  useEffect(() => {
    const isPredefined = options.some(opt => opt.value === value);
    if (value && !isPredefined && value !== "__other__") {
      setIsOther(true);
      setCustomValue(value);
    }
  }, [value, options]);

  const handleSelectChange = (newValue: string) => {
    if (newValue === "__other__") {
      setIsOther(true);
      setCustomValue("");
      onValueChange("");
    } else {
      setIsOther(false);
      setCustomValue("");
      onValueChange(newValue);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomValue(val);
    onValueChange(val);
  };

  if (isOther) {
    return (
      <div className="flex gap-2">
        <Input
          value={customValue}
          onChange={handleCustomChange}
          placeholder={inputPlaceholder}
          disabled={disabled}
          className={cn("flex-1 bg-background", className)}
        />
        <button
          type="button"
          onClick={() => {
            setIsOther(false);
            setCustomValue("");
            onValueChange("");
          }}
          className="text-xs text-muted-foreground hover:text-foreground px-2"
          disabled={disabled}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleSelectChange} disabled={disabled}>
      <SelectTrigger className={cn("bg-background", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
        <SelectItem value="__other__">Other...</SelectItem>
      </SelectContent>
    </Select>
  );
}
