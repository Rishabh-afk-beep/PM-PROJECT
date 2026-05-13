import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { type Circular } from "@/lib/types";
import { useCirculars, useCreateCircular, useDeleteCircular } from "@/hooks/use-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Megaphone, Plus, ExternalLink, CalendarDays, Search } from "lucide-react";
import { SkeletonCard } from "@/components/ui/loading-skeleton";
import ConfirmDelete from "@/components/ConfirmDelete";
import EmptyState from "@/components/resource-library/EmptyState";

const Circulars = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: circulars = [], isLoading } = useCirculars();
  const createMutation = useCreateCircular();
  const deleteMutation = useDeleteCircular();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachmentLink, setAttachmentLink] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const q = searchQuery.toLowerCase();
  const filtered = (circulars as Circular[]).filter(c => !q || (c.title || "").toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q));

  const addCircular = async () => {
    if (!title.trim() || !description.trim()) return;
    await createMutation.mutateAsync({
      title: title.trim(),
      description: description.trim(),
      attachment_link: attachmentLink.trim() || undefined,
    });
    setTitle(""); setDescription(""); setAttachmentLink("");
    setDialogOpen(false);
  };

  return (
    <div className="page-shell">
      <div className="page-header flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="section-label mb-3">Updates Board</div>
          <h1 className="text-2xl font-display font-semibold">Circulars & Announcements</h1>
          <p className="text-muted-foreground text-sm mt-1">Stay updated with the latest announcements</p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            if (!open) { setTitle(""); setDescription(""); setAttachmentLink(""); }
            setDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Circular</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Create Circular</DialogTitle>
                <DialogDescription className="sr-only">Fill out the form below to post a new circular.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Full announcement text..." rows={4} /></div>
                <div className="space-y-2"><Label>Attachment Link (optional)</Label><Input value={attachmentLink} onChange={e => setAttachmentLink(e.target.value)} placeholder="https://..." /></div>
                <Button onClick={addCircular} className="w-full" disabled={createMutation.isPending}>{createMutation.isPending ? "Posting..." : "Post Circular"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Search */}
      <div className="max-w-3xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search circulars..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
      </div>

      <div className="max-w-3xl space-y-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}

        {!isLoading && filtered.length === 0 && (
          <EmptyState icon={Megaphone} message={searchQuery ? "No circulars match your search" : "No circulars yet"} description="Announcements and updates will appear here" />
        )}

        {filtered.map((c) => (
          <Card key={c.id} className="hover:shadow-card-hover transition-shadow duration-200">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Megaphone className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-display">{c.title}</CardTitle>
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" /><span>{c.date}</span>
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <ConfirmDelete itemName={`"${c.title}"`} onConfirm={async () => { await deleteMutation.mutateAsync(c.id); }} className="h-8 w-8" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{c.description}</p>
              {c.attachment_link && (
                <a href={c.attachment_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 text-sm text-primary hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" /> View Attachment
                </a>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Circulars;
