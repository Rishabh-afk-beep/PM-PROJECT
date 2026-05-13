import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  type VideoCategory,
  type VideoSubcategory,
  type VideoLink,
} from "@/lib/types";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderOpen, ExternalLink, Play, Video, ArrowLeft, Pencil } from "lucide-react";
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

type View = "categories" | "subcategories" | "videos";

const VideoLinks = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [subcategories, setSubcategories] = useState<VideoSubcategory[]>([]);
  const [videos, setVideos] = useState<VideoLink[]>([]);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<View>("categories");
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedSubcatId, setSelectedSubcatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  const [newCatName, setNewCatName] = useState("");
  const [newSubcatName, setNewSubcatName] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [dialogCatId, setDialogCatId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // ── Data fetching ────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try { setCategories(await api.getVideoCategories()); } catch { toast.error("Failed to load categories"); }
  }, []);
  const fetchSubcategories = useCallback(async (catId: string) => {
    try { setSubcategories(await api.getVideoSubcategories(catId)); } catch { toast.error("Failed to load subcategories"); }
  }, []);
  const fetchVideos = useCallback(async (subcatId?: string) => {
    try { setVideos(await api.getVideos(subcatId)); } catch { toast.error("Failed to load videos"); }
  }, []);

  useEffect(() => { fetchCategories().finally(() => setLoading(false)); }, [fetchCategories]);
  useEffect(() => { if (selectedCatId) { fetchSubcategories(selectedCatId); fetchVideos(`cat-${selectedCatId}`); } }, [selectedCatId, fetchSubcategories, fetchVideos]);
  useEffect(() => { if (selectedSubcatId) fetchVideos(selectedSubcatId); }, [selectedSubcatId, fetchVideos]);

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
  const categoryDirectVideos = useMemo(() => sortItems(videos.filter((v) => v.subcategory_id === `cat-${selectedCatId}` && (!q || v.title.toLowerCase().includes(q)))), [videos, selectedCatId, q, sortBy]);
  const filteredVideos = useMemo(() => sortItems(videos.filter((v) => v.subcategory_id === selectedSubcatId && (!q || v.title.toLowerCase().includes(q)))), [videos, selectedSubcatId, q, sortBy]);

  const catPagination = usePagination(filteredCategories, 9);
  const subcatPagination = usePagination(filteredSubcats, 9);
  const directVideosPagination = usePagination(categoryDirectVideos, 9);
  const videosPagination = usePagination(filteredVideos, 9);

  useEffect(() => { catPagination.resetPage(); }, [q, sortBy]);
  useEffect(() => { subcatPagination.resetPage(); directVideosPagination.resetPage(); }, [q, sortBy, selectedCatId]);
  useEffect(() => { videosPagination.resetPage(); }, [q, sortBy, selectedSubcatId]);

  const openCategory = (id: string) => { setSelectedCatId(id); setView("subcategories"); setSearchQuery(""); };
  const openSubcategory = (id: string) => { setSelectedSubcatId(id); setView("videos"); setSearchQuery(""); };
  const goBack = () => {
    setSearchQuery("");
    if (view === "videos") { setSelectedSubcatId(null); setView("subcategories"); }
    else if (view === "subcategories") { setSelectedCatId(null); setView("categories"); }
  };

  // ── CRUD operations ──────────────────────────────────────
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    try { await api.createVideoCategory(newCatName.trim()); setNewCatName(""); toast.success("Category created"); fetchCategories(); }
    catch { toast.error("Failed to create category"); }
  };
  const addSubcategory = async () => {
    if (!newSubcatName.trim() || !selectedCatId) return;
    try { await api.createVideoSubcategory(selectedCatId, newSubcatName.trim()); setNewSubcatName(""); toast.success("Subcategory created"); fetchSubcategories(selectedCatId); }
    catch { toast.error("Failed to create subcategory"); }
  };
  const addVideoToCategory = async () => {
    if (!videoTitle.trim() || !videoLink.trim() || !selectedCatId) return;
    try { await api.createVideo({ subcategory_id: `cat-${selectedCatId}`, title: videoTitle.trim(), youtube_link: videoLink.trim() }); setVideoTitle(""); setVideoLink(""); toast.success("Video added"); fetchVideos(`cat-${selectedCatId}`); }
    catch { toast.error("Failed to add video"); }
  };
  const addVideoToSubcategory = async () => {
    if (!videoTitle.trim() || !videoLink.trim() || !selectedSubcatId) return;
    try { await api.createVideo({ subcategory_id: selectedSubcatId, title: videoTitle.trim(), youtube_link: videoLink.trim() }); setVideoTitle(""); setVideoLink(""); toast.success("Video added"); fetchVideos(selectedSubcatId); }
    catch { toast.error("Failed to add video"); }
  };

  const deleteVideo = async (id: string) => {
    try { await api.deleteVideo(id); toast.success("Video deleted"); setVideos(videos.filter((v) => v.id !== id)); }
    catch { toast.error("Failed to delete video"); }
  };
  const startEditing = (id: string, name: string) => { setEditingId(id); setEditingTitle(name); };
  const cancelEditing = () => { setEditingId(null); setEditingTitle(""); };
  const saveEditing = async (type: "video" | "category" | "subcategory") => {
    if (!editingId || !editingTitle.trim()) return;
    try {
      if (type === "video") {
        const video = videos.find((v) => v.id === editingId);
        if (video) { await api.updateVideo(editingId, { subcategory_id: video.subcategory_id, title: editingTitle.trim(), youtube_link: video.youtube_link }); setVideos(videos.map((v) => v.id === editingId ? { ...v, title: editingTitle.trim() } : v)); toast.success("Video title updated"); }
      } else if (type === "category") {
        await api.updateVideoCategory(editingId, editingTitle.trim()); setCategories(categories.map((c) => c.id === editingId ? { ...c, name: editingTitle.trim() } : c)); toast.success("Category name updated");
      } else {
        await api.updateVideoSubcategory(editingId, editingTitle.trim()); setSubcategories(subcategories.map((s) => s.id === editingId ? { ...s, name: editingTitle.trim() } : s)); toast.success("Subcategory name updated");
      }
    } catch { toast.error("Failed to update"); }
    setEditingId(null); setEditingTitle("");
  };
  const deleteCategory = async (id: string) => {
    try { await api.deleteVideoCategory(id); setCategories(categories.filter((c) => c.id !== id)); toast.success("Category deleted"); }
    catch { toast.error("Failed to delete category"); }
  };
  const deleteSubcategory = async (id: string) => {
    try { await api.deleteVideoSubcategory(id); setSubcategories(subcategories.filter((s) => s.id !== id)); toast.success("Subcategory deleted"); }
    catch { toast.error("Failed to delete subcategory"); }
  };

  const videoUploadFields = [
    { label: "Title", value: videoTitle, onChange: setVideoTitle, placeholder: "Video title" },
    { label: "YouTube Link", value: videoLink, onChange: setVideoLink, placeholder: "https://www.youtube.com/watch?v=..." },
  ];

  const breadcrumbItems = [
    { label: "All Categories", onClick: () => { setView("categories"); setSelectedCatId(null); setSelectedSubcatId(null); } },
    ...(selectedCat ? [{ label: selectedCat.name, onClick: () => { setView("subcategories"); setSelectedSubcatId(null); } }] : []),
    ...(selectedSubcat ? [{ label: selectedSubcat.name }] : []),
  ];

  const renderVideoCard = (video: VideoLink) => (
    <Card key={video.id} className="group hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <Play className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            {editingId === video.id ? (
              <InlineEditField value={editingTitle} onChange={setEditingTitle} onSave={() => saveEditing("video")} onCancel={cancelEditing} />
            ) : (
              <CardTitle className="text-sm font-medium leading-snug">{video.title}</CardTitle>
            )}
          </div>
          {isAdmin && editingId !== video.id && (
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => startEditing(video.id, video.title)}>
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
              <ConfirmDelete itemName={`video "${video.title}"`} onConfirm={() => deleteVideo(video.id)} className="h-7 w-7 opacity-0 group-hover:opacity-100" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{video.created_at}</span>
          <a href={video.youtube_link} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm"><ExternalLink className="h-3.5 w-3.5 mr-1" /> Watch</Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) return <div className="page-shell"><div className="page-header"><div className="section-label mb-3">Resource Library</div><h1 className="text-2xl font-display font-semibold">Video Lectures</h1></div><SkeletonGrid count={6} /></div>;

  return (
    <div className="page-shell">
      <div className="page-header flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {view !== "categories" && (
            <Button variant="ghost" size="icon" onClick={goBack}><ArrowLeft className="h-4 w-4" /></Button>
          )}
          <div>
            <div className="section-label mb-3">Lecture Library</div>
            <h1 className="text-2xl font-display font-semibold">Video Lectures</h1>
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </div>

        {isAdmin && view === "categories" && (
          <div className="flex gap-2">
            <AddItemDialog triggerLabel="Category" dialogTitle="New Category" fields={[{ label: "Category Name", value: newCatName, onChange: setNewCatName, placeholder: "e.g. Science" }]} onSubmit={addCategory} triggerVariant="outline" />
            <AddItemDialog triggerLabel="Add Video" dialogTitle="Add Video to Category" fields={[
              { label: "Category", value: dialogCatId, onChange: setDialogCatId, placeholder: "Select a category", type: "select" as const, options: categories.map(c => ({ label: c.name, value: c.id })) },
              ...videoUploadFields,
            ]} onSubmit={async () => {
              if (!dialogCatId || !videoTitle.trim() || !videoLink.trim()) { toast.error("Fill all fields"); return; }
              await api.createVideo({ subcategory_id: `cat-${dialogCatId}`, title: videoTitle.trim(), youtube_link: videoLink.trim() });
              setVideoTitle(""); setVideoLink(""); setDialogCatId("");
              toast.success("Video added");
              fetchCategories();
            }} submitLabel="Add Video" />
          </div>
        )}
        {isAdmin && view === "subcategories" && (
          <div className="flex gap-2">
            <AddItemDialog triggerLabel="Subcategory" dialogTitle={`New Subcategory in ${selectedCat?.name}`} fields={[{ label: "Subcategory Name", value: newSubcatName, onChange: setNewSubcatName, placeholder: "e.g. Optics" }]} onSubmit={addSubcategory} triggerVariant="outline" />
            <AddItemDialog triggerLabel="Add Video" dialogTitle={`Add Video to ${selectedCat?.name || ""}`} fields={videoUploadFields} onSubmit={addVideoToCategory} submitLabel="Add Video" />
          </div>
        )}
        {isAdmin && view === "videos" && (
          <AddItemDialog triggerLabel="Add Video" dialogTitle={`Add Video to ${selectedSubcat?.name || ""}`} fields={videoUploadFields} onSubmit={addVideoToSubcategory} submitLabel="Add Video" />
        )}
      </div>

      <SearchSortBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        placeholder={view === "categories" ? "Search categories..." : view === "subcategories" ? "Search subcategories & videos..." : "Search videos..."}
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
            {filteredCategories.length === 0 && <EmptyState icon={Video} message={searchQuery ? "No categories match your search" : "No categories yet"} description="Create a category to start organizing your video lectures" className="col-span-full" />}
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
                    subtitle={`${videos.filter((v) => v.subcategory_id === sub.id).length} videos`}
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
          {categoryDirectVideos.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Videos in {selectedCat?.name}</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {directVideosPagination.paginatedItems.map(renderVideoCard)}
              </div>
              <PaginationControls currentPage={directVideosPagination.currentPage} totalPages={directVideosPagination.totalPages} onPageChange={directVideosPagination.goToPage} />
            </div>
          )}
          {filteredSubcats.length === 0 && categoryDirectVideos.length === 0 && (
            <EmptyState icon={FolderOpen} message="No subcategories or videos yet" description="Add a subcategory or upload videos directly" />
          )}
        </div>
      )}

      {view === "videos" && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videosPagination.paginatedItems.map(renderVideoCard)}
          </div>
          <PaginationControls currentPage={videosPagination.currentPage} totalPages={videosPagination.totalPages} onPageChange={videosPagination.goToPage} />
          {filteredVideos.length === 0 && <EmptyState icon={Video} message="No videos in this subcategory" description="Add videos using the button above" />}
        </>
      )}
    </div>
  );
};

export default VideoLinks;
