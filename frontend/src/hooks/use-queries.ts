/**
 * React Query hooks — with optimistic updates for instant UI feedback.
 * All mutations update the local cache immediately, then sync to the server.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type {
  NoteCategory, NoteSubcategory, Note,
  VideoCategory, VideoSubcategory, VideoLink,
  Circular, Post, Comment,
  MentorshipCategory, MenteeStudent,
} from "@/lib/types";

// ── Query Keys ────────────────────────────────────────────
export const queryKeys = {
  noteCategories: ["noteCategories"] as const,
  noteSubcategories: (catId?: string) => ["noteSubcategories", catId] as const,
  notes: (subcatId?: string) => ["notes", subcatId] as const,
  videoCategories: ["videoCategories"] as const,
  videoSubcategories: (catId?: string) => ["videoSubcategories", catId] as const,
  videos: (subcatId?: string) => ["videos", subcatId] as const,
  circulars: ["circulars"] as const,
  posts: (page?: number) => ["posts", page] as const,
  comments: (postId: string) => ["comments", postId] as const,
  mentorshipCategories: ["mentorshipCategories"] as const,
  mentees: ["mentees"] as const,
  dashboardStats: ["dashboardStats"] as const,
  me: ["me"] as const,
};

// ── Helpers ───────────────────────────────────────────────
const tempId = () => `optimistic-${Date.now()}-${Math.random()}`;

// ── Note Categories ───────────────────────────────────────
export const useNoteCategories = () =>
  useQuery({ queryKey: queryKeys.noteCategories, queryFn: api.getNoteCategories });

export const useCreateNoteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createNoteCategory(name),
    onMutate: async (name) => {
      await qc.cancelQueries({ queryKey: queryKeys.noteCategories });
      const prev = qc.getQueryData<NoteCategory[]>(queryKeys.noteCategories);
      qc.setQueryData<NoteCategory[]>(queryKeys.noteCategories, (old = []) => [
        ...old, { id: tempId(), name, created_at: new Date().toISOString() },
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(queryKeys.noteCategories, ctx?.prev); toast.error("Failed to create category"); },
    onSuccess: () => { toast.success("Category created"); qc.invalidateQueries({ queryKey: queryKeys.noteCategories }); },
  });
};

export const useUpdateNoteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.updateNoteCategory(id, name),
    onMutate: async ({ id, name }) => {
      await qc.cancelQueries({ queryKey: queryKeys.noteCategories });
      const prev = qc.getQueryData<NoteCategory[]>(queryKeys.noteCategories);
      qc.setQueryData<NoteCategory[]>(queryKeys.noteCategories, (old = []) =>
        old.map((c) => c.id === id ? { ...c, name } : c));
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(queryKeys.noteCategories, ctx?.prev); toast.error("Failed to update category"); },
    onSuccess: () => toast.success("Category updated"),
  });
};

export const useDeleteNoteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteNoteCategory(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.noteCategories });
      const prev = qc.getQueryData<NoteCategory[]>(queryKeys.noteCategories);
      qc.setQueryData<NoteCategory[]>(queryKeys.noteCategories, (old = []) => old.filter((c) => c.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(queryKeys.noteCategories, ctx?.prev); toast.error("Failed to delete category"); },
    onSuccess: () => toast.success("Category deleted"),
  });
};

// ── Note Subcategories ────────────────────────────────────
export const useNoteSubcategories = (catId?: string) =>
  useQuery({ queryKey: queryKeys.noteSubcategories(catId), queryFn: () => api.getNoteSubcategories(catId), enabled: !!catId });

export const useCreateNoteSubcategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, name }: { categoryId: string; name: string }) => api.createNoteSubcategory(categoryId, name),
    onMutate: async ({ categoryId, name }) => {
      const key = queryKeys.noteSubcategories(categoryId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<NoteSubcategory[]>(key);
      qc.setQueryData<NoteSubcategory[]>(key, (old = []) => [
        ...old, { id: tempId(), name, category_id: categoryId, created_at: new Date().toISOString() },
      ]);
      return { prev, key };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(ctx!.key, ctx?.prev); toast.error("Failed to create subcategory"); },
    onSuccess: (_, vars) => { toast.success("Subcategory created"); qc.invalidateQueries({ queryKey: queryKeys.noteSubcategories(vars.categoryId) }); },
  });
};

export const useUpdateNoteSubcategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.updateNoteSubcategory(id, name),
    onSuccess: () => { toast.success("Subcategory updated"); qc.invalidateQueries({ queryKey: ["noteSubcategories"] }); },
    onError: () => toast.error("Failed to update subcategory"),
  });
};

export const useDeleteNoteSubcategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteNoteSubcategory(id),
    onSuccess: () => { toast.success("Subcategory deleted"); qc.invalidateQueries({ queryKey: ["noteSubcategories"] }); },
    onError: () => toast.error("Failed to delete subcategory"),
  });
};

// ── Notes ─────────────────────────────────────────────────
export const useNotes = (subcatId?: string) =>
  useQuery({ queryKey: queryKeys.notes(subcatId), queryFn: () => api.getNotes(subcatId), enabled: !!subcatId });

export const useCreateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { subcategory_id: string; title: string; drive_link: string }) => api.createNote(data),
    onMutate: async (data) => {
      const key = queryKeys.notes(data.subcategory_id);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Note[]>(key);
      qc.setQueryData<Note[]>(key, (old = []) => [
        ...old, { id: tempId(), ...data, created_at: new Date().toISOString() },
      ]);
      return { prev, key };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(ctx!.key, ctx?.prev); toast.error("Failed to upload note"); },
    onSuccess: () => { toast.success("Note uploaded"); qc.invalidateQueries({ queryKey: ["notes"] }); },
  });
};

export const useUpdateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { subcategory_id: string; title: string; drive_link: string } }) => api.updateNote(id, data),
    onMutate: async ({ id, data }) => {
      const key = queryKeys.notes(data.subcategory_id);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Note[]>(key);
      qc.setQueryData<Note[]>(key, (old = []) => old.map((n) => n.id === id ? { ...n, ...data } : n));
      return { prev, key };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(ctx!.key, ctx?.prev); toast.error("Failed to update note"); },
    onSuccess: () => toast.success("Note updated"),
  });
};

export const useDeleteNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteNote(id),
    onSuccess: () => { toast.success("Note deleted"); qc.invalidateQueries({ queryKey: ["notes"] }); },
    onError: () => toast.error("Failed to delete note"),
  });
};

// ── Video Categories ──────────────────────────────────────
export const useVideoCategories = () =>
  useQuery({ queryKey: queryKeys.videoCategories, queryFn: api.getVideoCategories });

export const useCreateVideoCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createVideoCategory(name),
    onMutate: async (name) => {
      await qc.cancelQueries({ queryKey: queryKeys.videoCategories });
      const prev = qc.getQueryData<VideoCategory[]>(queryKeys.videoCategories);
      qc.setQueryData<VideoCategory[]>(queryKeys.videoCategories, (old = []) => [
        ...old, { id: tempId(), name, created_at: new Date().toISOString() },
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(queryKeys.videoCategories, ctx?.prev); toast.error("Failed to create category"); },
    onSuccess: () => { toast.success("Category created"); qc.invalidateQueries({ queryKey: queryKeys.videoCategories }); },
  });
};

export const useUpdateVideoCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.updateVideoCategory(id, name),
    onMutate: async ({ id, name }) => {
      await qc.cancelQueries({ queryKey: queryKeys.videoCategories });
      const prev = qc.getQueryData<VideoCategory[]>(queryKeys.videoCategories);
      qc.setQueryData<VideoCategory[]>(queryKeys.videoCategories, (old = []) =>
        old.map((c) => c.id === id ? { ...c, name } : c));
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(queryKeys.videoCategories, ctx?.prev); toast.error("Failed to update category"); },
    onSuccess: () => toast.success("Category updated"),
  });
};

export const useDeleteVideoCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteVideoCategory(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.videoCategories });
      const prev = qc.getQueryData<VideoCategory[]>(queryKeys.videoCategories);
      qc.setQueryData<VideoCategory[]>(queryKeys.videoCategories, (old = []) => old.filter((c) => c.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(queryKeys.videoCategories, ctx?.prev); toast.error("Failed to delete category"); },
    onSuccess: () => toast.success("Category deleted"),
  });
};

// ── Video Subcategories ───────────────────────────────────
export const useVideoSubcategories = (catId?: string) =>
  useQuery({ queryKey: queryKeys.videoSubcategories(catId), queryFn: () => api.getVideoSubcategories(catId), enabled: !!catId });

export const useCreateVideoSubcategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, name }: { categoryId: string; name: string }) => api.createVideoSubcategory(categoryId, name),
    onSuccess: () => { toast.success("Subcategory created"); qc.invalidateQueries({ queryKey: ["videoSubcategories"] }); },
    onError: () => toast.error("Failed to create subcategory"),
  });
};

export const useUpdateVideoSubcategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.updateVideoSubcategory(id, name),
    onSuccess: () => { toast.success("Subcategory updated"); qc.invalidateQueries({ queryKey: ["videoSubcategories"] }); },
    onError: () => toast.error("Failed to update subcategory"),
  });
};

export const useDeleteVideoSubcategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteVideoSubcategory(id),
    onSuccess: () => { toast.success("Subcategory deleted"); qc.invalidateQueries({ queryKey: ["videoSubcategories"] }); },
    onError: () => toast.error("Failed to delete subcategory"),
  });
};

// ── Videos ────────────────────────────────────────────────
export const useVideos = (subcatId?: string) =>
  useQuery({ queryKey: queryKeys.videos(subcatId), queryFn: () => api.getVideos(subcatId), enabled: !!subcatId });

export const useCreateVideo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { subcategory_id: string; title: string; youtube_link: string }) => api.createVideo(data),
    onMutate: async (data) => {
      const key = queryKeys.videos(data.subcategory_id);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<VideoLink[]>(key);
      qc.setQueryData<VideoLink[]>(key, (old = []) => [
        ...old, { id: tempId(), ...data, created_at: new Date().toISOString() },
      ]);
      return { prev, key };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(ctx!.key, ctx?.prev); toast.error("Failed to add video"); },
    onSuccess: () => { toast.success("Video added"); qc.invalidateQueries({ queryKey: ["videos"] }); },
  });
};

export const useUpdateVideo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { subcategory_id: string; title: string; youtube_link: string } }) => api.updateVideo(id, data),
    onMutate: async ({ id, data }) => {
      const key = queryKeys.videos(data.subcategory_id);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<VideoLink[]>(key);
      qc.setQueryData<VideoLink[]>(key, (old = []) => old.map((v) => v.id === id ? { ...v, ...data } : v));
      return { prev, key };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(ctx!.key, ctx?.prev); toast.error("Failed to update video"); },
    onSuccess: () => toast.success("Video updated"),
  });
};

export const useDeleteVideo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteVideo(id),
    onSuccess: () => { toast.success("Video deleted"); qc.invalidateQueries({ queryKey: ["videos"] }); },
    onError: () => toast.error("Failed to delete video"),
  });
};

// ── Circulars ─────────────────────────────────────────────
export const useCirculars = () =>
  useQuery({ queryKey: queryKeys.circulars, queryFn: api.getCirculars });

export const useCreateCircular = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description: string; attachment_link?: string }) => api.createCircular(data),
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: queryKeys.circulars });
      const prev = qc.getQueryData<Circular[]>(queryKeys.circulars);
      qc.setQueryData<Circular[]>(queryKeys.circulars, (old = []) => [
        { id: tempId(), ...data, attachment_link: data.attachment_link ?? null, date: new Date().toISOString(), created_at: new Date().toISOString() },
        ...old,
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(queryKeys.circulars, ctx?.prev); toast.error("Failed to post circular"); },
    onSuccess: () => { toast.success("Circular posted"); qc.invalidateQueries({ queryKey: queryKeys.circulars }); },
  });
};

export const useDeleteCircular = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteCircular(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.circulars });
      const prev = qc.getQueryData<Circular[]>(queryKeys.circulars);
      qc.setQueryData<Circular[]>(queryKeys.circulars, (old = []) => old.filter((c) => c.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(queryKeys.circulars, ctx?.prev); toast.error("Failed to delete circular"); },
    onSuccess: () => toast.success("Circular deleted"),
  });
};

// ── Community ─────────────────────────────────────────────
export const usePosts = (page = 1, limit = 50) =>
  useQuery({ queryKey: queryKeys.posts(page), queryFn: () => api.getPosts(page, limit) });

export const useCreatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { content: string; image_url?: string }) => api.createPost(data),
    onSuccess: () => { toast.success("Post created"); qc.invalidateQueries({ queryKey: ["posts"] }); },
    onError: () => toast.error("Failed to create post"),
  });
};

export const useDeletePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePost(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["posts"] });
      const key = queryKeys.posts(1);
      const prev = qc.getQueryData<Post[]>(key);
      qc.setQueryData<Post[]>(key, (old = []) => old.filter((p) => p.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(queryKeys.posts(1), ctx?.prev); toast.error("Failed to delete post"); },
    onSuccess: () => toast.success("Post deleted"),
  });
};

export const useToggleLike = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.toggleLike(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
    onError: () => toast.error("Failed to update like"),
  });
};

export const useComments = (postId: string) =>
  useQuery({ queryKey: queryKeys.comments(postId), queryFn: () => api.getComments(postId), enabled: !!postId });

export const useAddComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) => api.addComment(postId, content),
    onMutate: async ({ postId, content }) => {
      const key = queryKeys.comments(postId);
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<Comment[]>(key);
      qc.setQueryData<Comment[]>(key, (old = []) => [
        ...old,
        { id: tempId(), post_id: postId, content, author_name: "You", created_at: new Date().toISOString() },
      ]);
      return { prev, key };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(ctx!.key, ctx?.prev); toast.error("Failed to add comment"); },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: queryKeys.comments(vars.postId) });
      qc.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

// ── Mentorship ────────────────────────────────────────────
export const useMentorshipCategories = () =>
  useQuery({ queryKey: queryKeys.mentorshipCategories, queryFn: api.getMentorshipCategories });

export const useCreateMentorshipCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.createMentorshipCategory(name),
    onMutate: async (name) => {
      await qc.cancelQueries({ queryKey: queryKeys.mentorshipCategories });
      const prev = qc.getQueryData<MentorshipCategory[]>(queryKeys.mentorshipCategories);
      qc.setQueryData<MentorshipCategory[]>(queryKeys.mentorshipCategories, (old = []) => [
        ...old, { id: tempId(), name, created_at: new Date().toISOString() },
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(queryKeys.mentorshipCategories, ctx?.prev); toast.error("Failed to add category"); },
    onSuccess: () => { toast.success("Category added"); qc.invalidateQueries({ queryKey: queryKeys.mentorshipCategories }); },
  });
};

export const useDeleteMentorshipCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMentorshipCategory(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.mentorshipCategories });
      const prev = qc.getQueryData<MentorshipCategory[]>(queryKeys.mentorshipCategories);
      qc.setQueryData<MentorshipCategory[]>(queryKeys.mentorshipCategories, (old = []) => old.filter((c) => c.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(queryKeys.mentorshipCategories, ctx?.prev); toast.error("Failed to delete category"); },
    onSuccess: () => toast.success("Category removed"),
  });
};

export const useMentees = () =>
  useQuery({ queryKey: queryKeys.mentees, queryFn: api.getMentees });

export const useCreateMentee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createMentee>[0]) => api.createMentee(data),
    onSuccess: () => { toast.success("Student added"); qc.invalidateQueries({ queryKey: queryKeys.mentees }); },
    onError: () => toast.error("Failed to add student"),
  });
};

export const useUpdateMentee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof api.updateMentee>[1] }) => api.updateMentee(id, data),
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: queryKeys.mentees });
      const prev = qc.getQueryData<MenteeStudent[]>(queryKeys.mentees);
      qc.setQueryData<MenteeStudent[]>(queryKeys.mentees, (old = []) =>
        old.map((m) => m.id === id ? { ...m, ...data } : m));
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(queryKeys.mentees, ctx?.prev); toast.error("Failed to update student"); },
    onSuccess: () => toast.success("Student updated"),
  });
};

export const useDeleteMentee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteMentee(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: queryKeys.mentees });
      const prev = qc.getQueryData<MenteeStudent[]>(queryKeys.mentees);
      qc.setQueryData<MenteeStudent[]>(queryKeys.mentees, (old = []) => old.filter((m) => m.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => { qc.setQueryData(queryKeys.mentees, ctx?.prev); toast.error("Failed to delete student"); },
    onSuccess: () => toast.success("Student removed"),
  });
};

// ── Dashboard ─────────────────────────────────────────────
export const useDashboardStats = () =>
  useQuery({ queryKey: queryKeys.dashboardStats, queryFn: api.getDashboardStats });

// ── Profile ───────────────────────────────────────────────
export const useUpdateProfile = () =>
  useMutation({
    mutationFn: (data: { name?: string; phone?: string; profile_picture_url?: string }) => api.updateProfile(data),
    onSuccess: () => toast.success("Profile updated"),
    onError: () => toast.error("Failed to update profile"),
  });
