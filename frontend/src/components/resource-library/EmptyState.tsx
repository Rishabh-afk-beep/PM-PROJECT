import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  description?: string;
  className?: string;
}

const EmptyState = ({ icon: Icon, message, description, className = "" }: EmptyStateProps) => (
  <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
    <div className="relative mb-6">
      {/* Decorative background rings */}
      <div className="absolute inset-0 -m-4 rounded-full bg-primary/5 animate-pulse" />
      <div className="absolute inset-0 -m-8 rounded-full bg-primary/5" />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/60 border border-border/40">
        <Icon className="h-10 w-10 text-muted-foreground/40" />
      </div>
    </div>
    <p className="text-base font-medium text-muted-foreground">{message}</p>
    {description && (
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground/60">{description}</p>
    )}
  </div>
);

export default EmptyState;
