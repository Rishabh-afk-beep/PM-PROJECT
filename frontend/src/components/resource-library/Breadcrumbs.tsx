import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => (
  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
    {items.map((item, i) => (
      <span key={i} className="flex items-center gap-1">
        {i > 0 && <ChevronRight className="h-3 w-3" />}
        {item.onClick ? (
          <span className="cursor-pointer hover:text-foreground" onClick={item.onClick}>
            {item.label}
          </span>
        ) : (
          <span>{item.label}</span>
        )}
      </span>
    ))}
  </div>
);

export default Breadcrumbs;
