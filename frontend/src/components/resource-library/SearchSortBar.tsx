import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption = "name-asc" | "name-desc" | "date-desc" | "date-asc";

interface SearchSortBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  placeholder?: string;
}

const SearchSortBar = ({ searchQuery, onSearchChange, sortBy, onSortChange, placeholder = "Search..." }: SearchSortBarProps) => (
  <div className="flex gap-3">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 border-border/50 bg-card shadow-card"
      />
    </div>
    <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
      <SelectTrigger className="w-[140px] shrink-0 border-border/50 bg-card shadow-card">
        <ArrowUpDown className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="name-asc">Name A–Z</SelectItem>
        <SelectItem value="name-desc">Name Z–A</SelectItem>
        <SelectItem value="date-desc">Newest</SelectItem>
        <SelectItem value="date-asc">Oldest</SelectItem>
      </SelectContent>
    </Select>
  </div>
);

export default SearchSortBar;
