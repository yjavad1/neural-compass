import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChipSelectProps {
  options: { value: string; label: string; description?: string }[];
  value?: string;
  onChange: (value: string) => void;
  allowOther?: boolean;
  placeholder?: string;
  className?: string;
}

export const ChipSelect = ({ 
  options, 
  value, 
  onChange, 
  allowOther = false,
  placeholder = "Select an option",
  className 
}: ChipSelectProps) => {
  const [showOther, setShowOther] = useState(false);
  const [otherValue, setOtherValue] = useState("");

  const handleOtherSubmit = () => {
    if (otherValue.trim()) {
      onChange(otherValue.trim());
      setShowOther(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => (
          <Button
            key={option.value}
            variant={value === option.value ? "default" : "outline"}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-auto p-4 text-left transition-all duration-200",
              value === option.value && "ring-2 ring-primary/20"
            )}
          >
            <div>
              <div className="font-medium text-sm">{option.label}</div>
              {option.description && (
                <div className="text-xs opacity-70 mt-1">{option.description}</div>
              )}
            </div>
          </Button>
        ))}
        
        {allowOther && (
          <Button
            variant={showOther ? "default" : "outline"}
            onClick={() => setShowOther(!showOther)}
            className="h-auto p-4 transition-all duration-200"
          >
            <div className="font-medium text-sm">Other...</div>
          </Button>
        )}
      </div>
      
      {showOther && (
        <div className="flex gap-2 animate-fade-in">
          <input
            type="text"
            value={otherValue}
            onChange={(e) => setOtherValue(e.target.value)}
            placeholder="Tell us more..."
            className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            onKeyPress={(e) => e.key === 'Enter' && handleOtherSubmit()}
          />
          <Button onClick={handleOtherSubmit} size="sm">
            Add
          </Button>
        </div>
      )}
    </div>
  );
};