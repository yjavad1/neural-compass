import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface MultiSelectChipsProps {
  options: { value: string; label: string; description?: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  allowOther?: boolean;
  placeholder?: string;
  className?: string;
  maxSelections?: number;
}

export const MultiSelectChips = ({ 
  options, 
  value = [], 
  onChange, 
  allowOther = false,
  placeholder = "Select options",
  className,
  maxSelections 
}: MultiSelectChipsProps) => {
  const [showOther, setShowOther] = useState(false);
  const [otherValue, setOtherValue] = useState("");

  const handleToggle = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleOtherSubmit = () => {
    if (otherValue.trim() && !value.includes(otherValue.trim())) {
      onChange([...value, otherValue.trim()]);
      setOtherValue("");
      setShowOther(false);
    }
  };

  const removeSelection = (valueToRemove: string) => {
    onChange(value.filter(v => v !== valueToRemove));
  };

  const canAddMore = !maxSelections || value.length < maxSelections;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Selected items */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((selectedValue) => {
            const option = options.find(opt => opt.value === selectedValue);
            const displayLabel = option?.label || selectedValue;
            
            return (
              <div
                key={selectedValue}
                className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full"
              >
                <span>{displayLabel}</span>
                <button
                  onClick={() => removeSelection(selectedValue)}
                  className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Available options */}
      {canAddMore && (
        <div className="flex flex-wrap gap-3">
          {options.map((option) => {
            const isSelected = value.includes(option.value);
            
            return (
              <Button
                key={option.value}
                variant={isSelected ? "default" : "outline"}
                onClick={() => handleToggle(option.value)}
                disabled={!isSelected && !canAddMore}
                className={cn(
                  "h-auto p-4 text-left transition-all duration-200",
                  isSelected && "ring-2 ring-primary/20 opacity-50"
                )}
              >
                <div>
                  <div className="font-medium text-sm">{option.label}</div>
                  {option.description && (
                    <div className="text-xs opacity-70 mt-1">{option.description}</div>
                  )}
                </div>
              </Button>
            );
          })}
          
          {allowOther && (
            <Button
              variant={showOther ? "default" : "outline"}
              onClick={() => setShowOther(!showOther)}
              disabled={!canAddMore}
              className="h-auto p-4 transition-all duration-200"
            >
              <div className="font-medium text-sm">Other...</div>
            </Button>
          )}
        </div>
      )}
      
      {showOther && canAddMore && (
        <div className="flex gap-2 animate-fade-in">
          <input
            type="text"
            value={otherValue}
            onChange={(e) => setOtherValue(e.target.value)}
            placeholder="Add your own..."
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            onKeyPress={(e) => e.key === 'Enter' && handleOtherSubmit()}
          />
          <Button onClick={handleOtherSubmit} size="sm">
            Add
          </Button>
        </div>
      )}
      
      {maxSelections && (
        <div className="text-xs text-muted-foreground">
          {value.length} of {maxSelections} selected
        </div>
      )}
    </div>
  );
};