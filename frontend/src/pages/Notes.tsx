import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  type NoteCategory,
  type NoteSubcategory,
  type Note,
} from "@/lib/types";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, ExternalLink, FileText, ArrowLeft, Pencil } from "lucide-react";
import { SkeletonGrid } from "@/components/ui/loading-skeleton";
import ConfirmDelete from "@/components/ConfirmDelete";
import { toast } from "sonner";
import { usePagination } from "@/hooks/use-pagination";
import PaginationControls from "@/components/PaginationControls";
import SearchSortBar, { type SortOption } from "@/components/resource-library/SearchSortBar";
import CategoryCard from "@/components/resource-library/CategoryCard";
import Breadcrumbs from "@/components/resource-library/Breadcrumbs";
import AddItemDialog from "@/components/resource-library/AddItemDialog";
import InlineEditField from "@/components/resource-library/InlineEditField";
import EmptyState from "@/components/resource-library/EmptyState";

type View = "categories" | "subcategories" | "notes";

const Notes = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [categories, setCategories] = useState<NoteCategory[]>([]);
  const [subcategories, setSubcategories] = useState<NoteSubcategory[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<View>("categories");
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedSubcatId, setSelectedSubcatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  const [newCatName, setNewCatName] = useState("");
  const [newSubcatName, setNewSubcatName] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteLink, setNoteLink] = useState("");
  const [dialogCatId, setDialogCatId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // ── Data fetching ────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try { setCategories(await api.getNoteCategories()); } catch { toast.error("Failed to load categories"); }
  }, []);
  const fetchSubcategories = useCallback(async (catId: string) => {
    try { setSubcategories(await api.getNoteSubcategories(catId)); } catch { toast.error("Failed to load subcategories"); }
  }, []);
  const fetchNotes = useCallback(async (subcatId?: string) => {
    try { setNotes(await api.getNotes(subcatId)); } catch { toast.error("Failed to load notes"); }
  }, []);

  useEffect(() => { fetchCategories().finally(() => setLoading(false)); }, [fetchCategories]);
  useEffect(() => { if (selectedCatId) { fetchSubcategories(selectedCatId); fetchNotes(`cat-${selectedCatId}`); } }, [selectedCatId, fetchSubcategories, fetchNotes]);
  useEffect(() => { if (selectedSubcatId) fetchNotes(selectedSubcatId); }, [selectedSubcatId, fetchNotes]);

  const q = searchQuery.toLowerCase();
  const selectedCat = categories.find((c) => c.id === selectedCatId);
  const selectedSubcat = subcategories.find((s) => s.id === selectedSubcatId);

  const sortNames = <T extends { name: string }>(arr: T[]) =>
    [...arr].sort((a, b) => sortBy === "name-desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));

  const sortItems = <T extends { title: string; created_at: string }>(arr: T[]) =>
    [...arr].sort((a, b) => {
      if (sortBy === "name-asc") return a.title.localeCompare(b.title);
      if (sortBy === "name-desc") return b.title.localeCompare(a.title);
      if (sortBy === "date-desc") return b.created_at.localeCompare(a.created_at);
      return a.created_at.localeCompare(b.created_at);
    });

  const filteredCategories = useMemo(() => sortNames(categories.filter((c) => !q || c.name.toLowerCase().includes(q))), [categories, q, sortBy]);
  const filteredSubcats = useMemo(() => sortNames(subcategories.filter((s) => s.category_id === selectedCatId && (!q || s.name.toLowerCase().includes(q)))), [subcategories, selectedCatId, q, sortBy]);
  const categoryDirectNotes = useMemo(() => sortItems(notes.filter((n) => n.subcategory_id === `cat-${selectedCatId}` && (!q || n.title.toLowerCase().includes(q)))), [notes, selectedCatId, q, sortBy]);
  const filteredNotes = useMemo(() => sortItems(notes.filter((n) => n.subcategory_id === selectedSubcatId && (!q || n.title.toLowerCase().includes(q)))), [notes, selectedSubcatId, q, sortBy]);

  const catPagination = usePagination(filteredCategories, 9);
  const subcatPagination = usePagination(filteredSubcats, 9);
  const directNotesPagination = usePagination(categoryDirectNotes, 9);
  const notesPagination = usePagination(filteredNotes, 9);

  useEffect(() => { catPagination.resetPage(); }, [q, sortBy]);
  useEffect(() => { subcatPagination.resetPage(); directNotesPagination.resetPage(); }, [q, sortBy, selectedCatId]);
  useEffect(() => { notesPagination.resetPage(); }, [q, sortBy, selectedSubcatId]);

  const openCategory = (id: string) => { setSelectedCatId(id); setView("subcategories"); setSearchQuery(""); };
  const openSubcategory = (id: string) => { setSelectedSubcatId(id); setView("notes"); setSearchQuery(""); };
  const goBack = () => {
    setSearchQuery("");
    if (view === "notes") { setSelectedSubcatId(null); setView("subcategories"); }
    else if (view === "subcategories") { setSelectedCatId(null); setView("categories"); }
  };

  // ── CRUD operations ──────────────────────────────────────
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    try { await api.createNoteCategory(newCatName.trim()); setNewCatName(""); toast.success("Category created"); fetchCategories(); }
    catch { toast.error("Failed to create category"); }
  };
  const addSubcategory = async () => {
    if (!newSubcatName.trim() || !selectedCatId) return;
    try { await api.createNoteSubcategory(selectedCatId, newSubcatName.trim()); setNewSubcatName(""); toast.success("Subcategory created"); fetchSubcategories(selectedCatId); }
    catch { toast.error("Failed to create subcategory"); }
  };
  const addNoteToCategory = async () => {
    if (!noteTitle.trim() || !noteLink.trim() || !selectedCatId) return;
    try { await api.createNote({ subcategory_id: `cat-${selectedCatId}`, title: noteTitle.trim(), drive_link: noteLink.trim() }); setNoteTitle(""); setNoteLink(""); toast.success("Note uploaded"); fetchNotes(`cat-${selectedCatId}`); }
    catch { toast.error("Failed to upload note"); }
  };
  const addNoteToSubcategory = async () => {
    if (!noteTitle.trim() || !noteLink.trim() || !selectedSubcatId) return;
    try { await api.createNote({ subcategory_id: selectedSubcatId, title: noteTitle.trim(), drive_link: noteLink.trim() }); setNoteTitle(""); setNoteLink(""); toast.success("Note uploaded"); fetchNotes(selectedSubcatId); }
    catch { toast.error("Failed to upload note"); }
  };

  const deleteNote = async (id: string) => {
    try { await api.deleteNote(id); toast.success("Note deleted"); setNotes(notes.filter((n) => n.id !== id)); }
    catch { toast.error("Failed to delete note"); }
  };
  const startEditing = (id: string, name: string) => { setEditingId(id); setEditingTitle(name); };
  const cancelEditing = () => { setEditingId(null); setEditingTitle(""); };
  const saveEditing = async (type: "note" | "category" | "subcategory") => {
    if (!editingId || !editingTitle.trim()) return;
    try {
      if (type === "note") {
        const note = notes.find((n) => n.id === editingId);
        if (note) { await api.updateNote(editingId, { subcategory_id: note.subcategory_id, title: editingTitle.trim(), drive_link: note.drive_link }); setNotes(notes.map((n) => n.id === editingId ? { ...n, title: editingTitle.trim() } : n)); toast.success("Note title updated"); }
      } else if (type === "category") {
        await api.updateNoteCategory(editingId, editingTitle.trim()); setCategories(categories.map((c) => c.id === editingId ? { ...c, name: editingTitle.trim() } : c)); toast.success("Category name updated");
      } else {
        await api.updateNoteSubcategory(editingId, editingTitle.trim()); setSubcategories(subcategories.map((s) => s.id === editingId ? { ...s, name: editingTitle.trim() } : s)); toast.success("Subcategory name updated");
      }
    } catch { toast.error("Failed to update"); }
    setEditingId(null); setEditingTitle("");
  };
  const deleteCategory = async (id: string) => {
    try { await api.deleteNoteCategory(id); setCategories(categories.filter((c) => c.id !== id)); toast.success("Category deleted"); }
    catch { toast.error("Failed to delete category"); }
  };
  const deleteSubcategory = async (id: string) => {
    try { await api.deleteNoteSubcategory(id); setSubcategories(subcategories.filter((s) => s.id !== id)); toast.success("Subcategory deleted"); }
    catch { toast.error("Failed to delete subcategory"); }
  };

  const noteUploadFields = [
    { label: "Title", value: noteTitle, onChange: setNoteTitle, placeholder: "Note title" },
    { label: "Google Drive Link", value: noteLink, onChange: setNoteLink, placeholder: "https://drive.google.com/..." },
  ];

  const breadcrumbItems = [
    { label: "All Categories", onClick: () => { setView("categories"); setSelectedCatId(null); setSelectedSubcatId(null); } },
    ...(selectedCat ? [{ label: selectedCat.name, onClick: () => { setView("subcategories"); setSelectedSubcatId(null); } }] : []),
    ...(selectedSubcat ? [{ label: selectedSubcat.name }] : []),
  ];

  const renderNoteCard = (note: Note) => (
    <Card key={note.id} className="group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            {editingId === note.id ? (
              <InlineEditField value={editingTitle} onChange={setEditingTitle} onSave={() => saveEditing("note")} onCancel={cancelEditing} />
            ) : (
              <CardTitle className="text-sm font-medium leading-snug">{note.title}</CardTitle>
            )}
          </div>
          {isAdmin && editingId !== note.id && (
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => startEditing(note.id, note.title)}>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <ConfirmDelete itemName={`note "${note.title}"`} onConfirm={() => deleteNote(note.id)} className="h-7 w-7 opacity-0 group-hover:opacity-100" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{note.created_at}</span>
          <a href={note.drive_link} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm"><ExternalLink className="h-3.5 w-3.5 mr-1" /> Open</Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) return <div className="page-shell"><div className="page-header"><div className="section-label mb-3">Resource Library</div><h1 className="text-2xl font-display font-semibold">Study Notes</h1></div><SkeletonGrid count={6} /></div>;

  return (
    <div className="page-shell">
      <div className="page-header flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {view !== "categories" && (
            <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="h-4 w-4" /></Button>
          )}
          <div>
            <div className="section-label mb-3">Resource Library</div>
            <h1 className="text-2xl font-display font-semibold">Study Notes</h1>
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </div>

        {isAdmin && view === "categories" && (
          <div className="flex gap-2">
            <AddItemDialog triggerLabel="Category" dialogTitle="New Category" fields={[{ label: "Category Name", value: newCatName, onChange: setNewCatName, placeholder: "e.g. Computer Science" }]} onSubmit={addCategory} triggerVariant="outline" />
            <AddItemDialog triggerLabel="Upload Note" dialogTitle="Upload Note to Category" fields={[
              { label: "Category", value: dialogCatId, onChange: setDialogCatId, placeholder: "Select a category", type: "select" as const, options: categories.map(c => ({ label: c.name, value: c.id })) },
              ...noteUploadFields,
            ]} onSubmit={async () => {
              if (!dialogCatId || !noteTitle.trim() || !noteLink.trim()) { toast.error("Fill all fields"); return; }
              await api.createNote({ subcategory_id: `cat-${dialogCatId}`, title: noteTitle.trim(), drive_link: noteLink.trim() });
              setNoteTitle(""); setNoteLink(""); setDialogCatId("");
              toast.success("Note uploaded");
              fetchCategories();
            }} submitLabel="Upload" />
          </div>
        )}
        {isAdmin && view === "subcategories" && (
          <div className="flex gap-2">
            <AddItemDialog triggerLabel="Subcategory" dialogTitle={`New Subcategory in ${selectedCat?.name}`} fields={[{ label: "Subcategory Name", value: newSubcatName, onChange: setNewSubcatName, placeholder: "e.g. Trigonometry" }]} onSubmit={addSubcategory} triggerVariant="outline" />
            <AddItemDialog triggerLabel="Upload Note" dialogTitle={`Upload Note to ${selectedCat?.name || ""}`} fields={noteUploadFields} onSubmit={addNoteToCategory} submitLabel="Upload" />
          </div>
        )}
        {isAdmin && view === "notes" && (
          <AddItemDialog triggerLabel="Upload Note" dialogTitle={`Upload Note to ${selectedSubcat?.name || ""}`} fields={noteUploadFields} onSubmit={addNoteToSubcategory} submitLabel="Upload" />
        )}
      </div>

      <SearchSortBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        placeholder={view === "categories" ? "Search categories..." : view === "subcategories" ? "Search subcategories & notes..." : "Search notes..."}
      />

      {view === "categories" && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {catPagination.paginatedItems.map((cat) => (
              <CategoryCard
                key={cat.id}
                id={cat.id}
                name={cat.name}
                subtitle={`${subcategories.filter((s) => s.category_id === cat.id).length} subcategories`}
                isEditing={editingId === cat.id}
                editingTitle={editingTitle}
                isAdmin={isAdmin}
                onOpen={() => openCategory(cat.id)}
                onEditStart={() => startEditing(cat.id, cat.name)}
                onEditChange={setEditingTitle}
                onEditSave={() => saveEditing("category")}
                onEditCancel={cancelEditing}
                onDelete={() => deleteCategory(cat.id)}
              />
            ))}
            {filteredCategories.length === 0 && <EmptyState icon={FolderOpen} message={searchQuery ? "No categories match your search" : "No categories yet"} description="Create a category to start organizing your study notes" className="col-span-full" />}
          </div>
          <PaginationControls currentPage={catPagination.currentPage} totalPages={catPagination.totalPages} onPageChange={catPagination.goToPage} />
        </>
      )}

      {view === "subcategories" && (
        <div className="space-y-6">
          {filteredSubcats.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Subcategories</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subcatPagination.paginatedItems.map((sub) => (
                  <CategoryCard
                    key={sub.id}
                    id={sub.id}
                    name={sub.name}
                    subtitle={`${notes.filter((n) => n.subcategory_id === sub.id).length} notes`}
                    isEditing={editingId === sub.id}
                    editingTitle={editingTitle}
                    isAdmin={isAdmin}
                    onOpen={() => openSubcategory(sub.id)}
                    onEditStart={() => startEditing(sub.id, sub.name)}
                    onEditChange={setEditingTitle}
                    onEditSave={() => saveEditing("subcategory")}
                    onEditCancel={cancelEditing}
                    onDelete={() => deleteSubcategory(sub.id)}
                    iconClassName="text-accent-foreground"
                  />
                ))}
              </div>
              <PaginationControls currentPage={subcatPagination.currentPage} totalPages={subcatPagination.totalPages} onPageChange={subcatPagination.goToPage} />
            </div>
          )}
          {categoryDirectNotes.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Notes in {selectedCat?.name}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {directNotesPagination.paginatedItems.map(renderNoteCard)}
              </div>
              <PaginationControls currentPage={directNotesPagination.currentPage} totalPages={directNotesPagination.totalPages} onPageChange={directNotesPagination.goToPage} />
            </div>
          )}
          {filteredSubcats.length === 0 && categoryDirectNotes.length === 0 && (
            <EmptyState icon={FolderOpen} message="No subcategories or notes yet" description="Add a subcategory or upload notes directly" />
          )}
        </div>
      )}

      {view === "notes" && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notesPagination.paginatedItems.map(renderNoteCard)}
          </div>
          <PaginationControls currentPage={notesPagination.currentPage} totalPages={notesPagination.totalPages} onPageChange={notesPagination.goToPage} />
          {filteredNotes.length === 0 && <EmptyState icon={FileText} message="No notes in this subcategory" description="Upload notes using the button above" />}
        </>
      )}
    </div>
  );
};

export default Notes;
