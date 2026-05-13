import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Megaphone, Users, MessageSquare, Sparkles, TrendingUp, FolderOpen, Video } from "lucide-react";
import { type Circular, type Post } from "@/lib/types";
import { useDashboardStats, useCirculars, usePosts } from "@/hooks/use-queries";
import { SkeletonStat, SkeletonCard } from "@/components/ui/loading-skeleton";
import { motion } from "framer-motion";

const Dashboard = () => {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: circulars = [], isLoading: circularsLoading } = useCirculars();
  const { data: posts = [], isLoading: postsLoading } = usePosts(1, 10);

  const s = stats ?? { total_notes: 0, note_categories: 0, total_videos: 0, video_categories: 0, circulars: 0, mentees: 0, community_posts: 0, total_users: 0 };

  const recentCirculars = circulars.slice(0, 3) as Circular[];
  const recentPosts = posts.slice(0, 3) as Post[];

  const statCards = useMemo(() => ([
    { label: "Total Notes", value: s.total_notes, icon: BookOpen, accent: "bg-primary/10 text-primary" },
    { label: "Categories", value: s.note_categories, icon: FolderOpen, accent: "bg-primary/10 text-primary" },
    { label: "Total Videos", value: s.total_videos, icon: Video, accent: "bg-accent/10 text-accent" },
    { label: "Circulars", value: s.circulars, icon: Megaphone, accent: "bg-accent/10 text-accent" },
    { label: "Mentees", value: s.mentees, icon: Users, accent: "bg-primary/10 text-primary" },
    { label: "Posts", value: s.community_posts, icon: MessageSquare, accent: "bg-primary/10 text-primary" },
  ]), [s]);

  return (
    <div className="page-shell">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="page-header overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none text-primary">
          <TrendingUp className="w-64 h-64" />
        </div>
        <div className="section-label">Admin Dashboard</div>
        <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-display font-semibold tracking-tight md:text-4xl">Welcome back, {user?.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">A cleaner overview of notes, circulars, mentorship, and community activity in one place.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-secondary/60 px-4 py-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" />
            Refreshed workspace
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {statsLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonStat key={i} />)
        ) : (
          statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 + 0.2, duration: 0.4 }}
            >
              <Card className="group relative overflow-hidden bg-card/60 backdrop-blur-xl border-border/40 transition-all hover:-translate-y-1 hover:shadow-card-hover">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <div className={`rounded-xl p-2.5 transition-colors ${stat.accent} group-hover:bg-primary group-hover:text-primary-foreground`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-display font-bold tracking-tight">{stat.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="h-full bg-card/60 backdrop-blur-xl border-border/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display">Recent Circulars</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {circularsLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
              {!circularsLoading && recentCirculars.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No circulars yet</p>
              )}
              {recentCirculars.map((c) => (
                <div key={c.id} className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50 -mx-3 last:mb-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                    <Megaphone className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.date}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card className="h-full bg-card/60 backdrop-blur-xl border-border/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-display">Recent Community Activity</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {postsLoading && Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
              {!postsLoading && recentPosts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No posts yet</p>
              )}
              {recentPosts.map((p) => (
                <div key={p.id} className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-muted/50 -mx-3 last:mb-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{p.author_name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{p.content}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
