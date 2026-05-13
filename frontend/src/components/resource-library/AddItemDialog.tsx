import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export interface FieldConfig {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: "text" | "select";
  options?: { label: string; value: string }[];
}

interface AddItemDialogProps {
  triggerLabel: string;
  dialogTitle: string;
  fields: FieldConfig[];
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
  triggerVariant?: "default" | "outline";
}

const AddItemDialog = ({
  triggerLabel,
  dialogTitle,
  fields,
  onSubmit,
  submitLabel = "Create",
  triggerVariant = "default",
}: AddItemDialogProps) => {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isMobile = useIsMobile();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit();
      setOpen(false);
    } catch {
      // error handled in onSubmit
    } finally {
      setSubmitting(false);
    }
  };

  const Content = (
    <div className="space-y-4 px-4 pb-4 md:px-0 md:pb-0">
      {fields.map((field, i) => (
        <div key={i} className="space-y-2">
          <Label>{field.label}</Label>
          {field.type === "select" && field.options ? (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              placeholder={field.placeholder}
            />
          )}
        </div>
      ))}
      <Button onClick={handleSubmit} className="w-full" disabled={submitting}>
        {submitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant={triggerVariant} size="sm">
            <Plus className="h-4 w-4 mr-1" /> {triggerLabel}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle className="font-display">{dialogTitle}</DrawerTitle>
          </DrawerHeader>
          {Content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm">
          <Plus className="h-4 w-4 mr-1" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">{dialogTitle}</DialogTitle>
        </DialogHeader>
        {Content}
      </DialogContent>
    </Dialog>
  );
};

export default AddItemDialog;
