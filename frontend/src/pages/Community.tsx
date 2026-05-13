import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { type Comment } from "@/lib/types";
import { usePosts, useCreatePost, useDeletePost, useToggleLike, useComments, useAddComment } from "@/hooks/use-queries";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Send, MessageSquare } from "lucide-react";
import { SkeletonCard } from "@/components/ui/loading-skeleton";
import ConfirmDelete from "@/components/ConfirmDelete";
import EmptyState from "@/components/resource-library/EmptyState";

const Community = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { data: posts = [], isLoading } = usePosts();
  const createPost = useCreatePost();
  const deletePost = useDeletePost();
  const toggleLike = useToggleLike();
  const addComment = useAddComment();

  const [newPost, setNewPost] = useState("");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<Record<string, string>>({});

  const handleCreatePost = async () => {
    if (!newPost.trim()) return;
    await createPost.mutateAsync({ content: newPost.trim() });
    setNewPost("");
  };

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="page-shell max-w-3xl">
      <div className="page-header">
        <div className="section-label mb-3">Student Space</div>
        <h1 className="text-2xl font-display font-semibold">Community</h1>
        <p className="text-muted-foreground text-sm mt-1">Share ideas and learn together</p>
      </div>

      {/* Create post */}
      <Card className="overflow-hidden">
        <CardContent className="pt-5">
          <Textarea
            placeholder="What's on your mind? Share a question, resource, or idea..."
            value={newPost} onChange={e => setNewPost(e.target.value)} rows={3}
            className="border-border/50 bg-muted/30 focus:bg-background resize-none"
          />
          <div className="flex justify-end mt-3">
            <Button size="sm" onClick={handleCreatePost} disabled={!newPost.trim() || createPost.isPending} className="gap-1.5">
              <Send className="h-3.5 w-3.5" /> {createPost.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts feed */}
      <div className="space-y-4">
        {isLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}

        {!isLoading && posts.length === 0 && (
          <EmptyState icon={MessageSquare} message="No posts yet" description="Be the first to share something with the community!" />
        )}

        {posts.map((post) => {
          const initials = (post.author_name || "User").split(" ").map((n: string) => n[0]).join("").slice(0, 2);
          return (
            <Card key={post.id} className="hover:shadow-card-hover transition-shadow duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-semibold">{post.author_name}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(post.created_at)}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <ConfirmDelete itemName="this post" onConfirm={async () => { await deletePost.mutateAsync(post.id); }} className="h-8 w-8" />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

                <div className="flex items-center gap-4 pt-3 border-t border-border/40">
                  <button onClick={() => toggleLike.mutate(post.id)} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${(post.likes || []).includes(user?.id || "me") ? "text-destructive" : "text-muted-foreground hover:text-destructive"}`}>
                    <Heart className={`h-4 w-4 ${(post.likes || []).includes(user?.id || "me") ? "fill-current" : ""}`} />
                    {(post.likes || []).length}
                  </button>
                  <button onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)} className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <MessageCircle className="h-4 w-4" />{post.comment_count}
                  </button>
                </div>

                {expandedPost === post.id && (
                  <CommentsSection
                    postId={post.id}
                    newComment={newComment[post.id] || ""}
                    onCommentChange={(val) => setNewComment((prev) => ({ ...prev, [post.id]: val }))}
                    onSubmit={async () => {
                      const val = newComment[post.id] || "";
                      if (!val.trim()) return;
                      await addComment.mutateAsync({ postId: post.id, content: val.trim() });
                      setNewComment((prev) => ({ ...prev, [post.id]: "" }));
                    }}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

const CommentsSection = ({ postId, newComment, onCommentChange, onSubmit }: { postId: string; newComment: string; onCommentChange: (v: string) => void; onSubmit: () => void }) => {
  const { data: comments = [] } = useComments(postId);
  return (
    <div className="space-y-3 pt-3 border-t border-border/40">
      {(comments as Comment[]).map((c) => (
        <div key={c.id} className="flex gap-2">
          <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px] bg-muted text-muted-foreground">{(c.author_name || "U")[0]}</AvatarFallback></Avatar>
          <div className="flex-1 rounded-xl bg-muted/50 px-3 py-2">
            <p className="text-xs font-semibold">{c.author_name}</p>
            <p className="text-xs text-foreground/80 whitespace-pre-wrap">{c.content}</p>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <input className="flex-1 text-sm bg-muted/40 rounded-xl px-3 py-2 outline-none border border-border/40 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all" placeholder="Write a comment..." value={newComment} onChange={e => onCommentChange(e.target.value)} onKeyDown={e => e.key === "Enter" && onSubmit()} />
        <Button size="sm" variant="ghost" onClick={onSubmit}><Send className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
};

export default Community;
