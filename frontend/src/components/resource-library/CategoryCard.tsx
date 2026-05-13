import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, Pencil, ChevronRight } from "lucide-react";
import InlineEditField from "./InlineEditField";
import ConfirmDelete from "@/components/ConfirmDelete";

interface CategoryCardProps {
  id: string;
  name: string;
  subtitle: string;
  isEditing: boolean;
  editingTitle: string;
  isAdmin: boolean;
  onOpen: () => void;
  onEditStart: () => void;
  onEditChange: (value: string) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onDelete: () => void;
  iconClassName?: string;
}

const CategoryCard = ({
  name,
  subtitle,
  isEditing,
  editingTitle,
  isAdmin,
  onOpen,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onDelete,
  iconClassName = "text-primary",
}: CategoryCardProps) => (
  <Card
    className="cursor-pointer group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
    onClick={() => !isEditing && onOpen()}
  >
    <CardContent className="flex items-center justify-between pt-6">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <FolderOpen className={`h-5 w-5 shrink-0 ${iconClassName}`} />
        {isEditing ? (
          <InlineEditField
            value={editingTitle}
            onChange={onEditChange}
            onSave={onEditSave}
            onCancel={onEditCancel}
            stopPropagation
          />
        ) : (
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        {isAdmin && !isEditing && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100"
              onClick={(e) => { e.stopPropagation(); onEditStart(); }}
            >
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
            <div onClick={(e) => e.stopPropagation()}>
              <ConfirmDelete itemName={`"${name}"`} onConfirm={onDelete} className="h-7 w-7 opacity-0 group-hover:opacity-100" />
            </div>
          </>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </CardContent>
  </Card>
);

export default CategoryCard;
