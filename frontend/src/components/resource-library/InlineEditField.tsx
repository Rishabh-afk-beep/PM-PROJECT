import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface InlineEditFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  stopPropagation?: boolean;
}

const InlineEditField = ({ value, onChange, onSave, onCancel, stopPropagation }: InlineEditFieldProps) => (
  <div
    className="flex items-center gap-1 flex-1"
    onClick={stopPropagation ? (e) => e.stopPropagation() : undefined}
  >
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-7 text-sm"
      autoFocus
      onKeyDown={(e) => {
        if (e.key === "Enter") onSave();
        if (e.key === "Escape") onCancel();
      }}
    />
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onSave}>
      <Check className="h-3.5 w-3.5 text-green-500" />
    </Button>
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onCancel}>
      <X className="h-3.5 w-3.5 text-muted-foreground" />
    </Button>
  </div>
);

export default InlineEditField;
