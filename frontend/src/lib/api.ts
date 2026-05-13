/**
 * API client for the TeachLearn backend.
 */

import { getIdToken } from "@/lib/firebase";

const defaultBase = `http://${window.location.hostname}:8000/api/v1`;
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? defaultBase;

/** Get token with a timeout so the app doesn't hang if Firebase is unresponsive */
async function getTokenSafe(timeoutMs = 5000): Promise<string | null> {
  try {
    const result = await Promise.race([
      getIdToken(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
    ]);
    return result;
  } catch (err) {
    console.error("[API] Failed to get Firebase token:", err);
    return null;
  }
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };

  const token = await getTokenSafe();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Abort after 10 seconds so requests never hang forever
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail ?? `API error ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Request to ${path} timed out after 10s`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ── Auth ──────────────────────────────────────────────────

export const api = {
  // Auth
  register: (data: { name: string; email: string; phone: string }) =>
    request<{ id: string; message: string }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  me: () => request<{ id: string; name: string; email: string; phone: string; role: string; profile_picture_url: string | null }>("/auth/me"),

  // ── Note Categories ─────────────────────────────────────
  getNoteCategories: () => request<{ id: string; name: string }[]>("/note-categories"),
  createNoteCategory: (name: string) => request("/note-categories", { method: "POST", body: JSON.stringify({ name }) }),
  updateNoteCategory: (id: string, name: string) => request(`/note-categories/${id}`, { method: "PUT", body: JSON.stringify({ name }) }),
  deleteNoteCategory: (id: string) => request(`/note-categories/${id}`, { method: "DELETE" }),

  // ── Note Subcategories ──────────────────────────────────
  getNoteSubcategories: (categoryId?: string) => request<{ id: string; category_id: string; name: string }[]>(`/note-subcategories${categoryId ? `?category_id=${categoryId}` : ""}`),
  createNoteSubcategory: (category_id: string, name: string) => request("/note-subcategories", { method: "POST", body: JSON.stringify({ category_id, name }) }),
  updateNoteSubcategory: (id: string, name: string) => request(`/note-subcategories/${id}`, { method: "PUT", body: JSON.stringify({ name }) }),
  deleteNoteSubcategory: (id: string) => request(`/note-subcategories/${id}`, { method: "DELETE" }),

  // ── Notes ───────────────────────────────────────────────
  getNotes: (subcategoryId?: string) => request<{ id: string; subcategory_id: string; title: string; drive_link: string; created_at: string }[]>(`/notes${subcategoryId ? `?subcategory_id=${subcategoryId}` : ""}`),
  createNote: (data: { subcategory_id: string; title: string; drive_link: string }) => request("/notes", { method: "POST", body: JSON.stringify(data) }),
  updateNote: (id: string, data: { subcategory_id: string; title: string; drive_link: string }) => request(`/notes/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteNote: (id: string) => request(`/notes/${id}`, { method: "DELETE" }),

  // ── Video Categories ────────────────────────────────────
  getVideoCategories: () => request<{ id: string; name: string }[]>("/video-categories"),
  createVideoCategory: (name: string) => request("/video-categories", { method: "POST", body: JSON.stringify({ name }) }),
  updateVideoCategory: (id: string, name: string) => request(`/video-categories/${id}`, { method: "PUT", body: JSON.stringify({ name }) }),
  deleteVideoCategory: (id: string) => request(`/video-categories/${id}`, { method: "DELETE" }),

  // ── Video Subcategories ─────────────────────────────────
  getVideoSubcategories: (categoryId?: string) => request<{ id: string; category_id: string; name: string }[]>(`/video-subcategories${categoryId ? `?category_id=${categoryId}` : ""}`),
  createVideoSubcategory: (category_id: string, name: string) => request("/video-subcategories", { method: "POST", body: JSON.stringify({ category_id, name }) }),
  updateVideoSubcategory: (id: string, name: string) => request(`/video-subcategories/${id}`, { method: "PUT", body: JSON.stringify({ name }) }),
  deleteVideoSubcategory: (id: string) => request(`/video-subcategories/${id}`, { method: "DELETE" }),

  // ── Videos ──────────────────────────────────────────────
  getVideos: (subcategoryId?: string) => request<{ id: string; subcategory_id: string; title: string; youtube_link: string; created_at: string }[]>(`/videos${subcategoryId ? `?subcategory_id=${subcategoryId}` : ""}`),
  createVideo: (data: { subcategory_id: string; title: string; youtube_link: string }) => request("/videos", { method: "POST", body: JSON.stringify(data) }),
  updateVideo: (id: string, data: { subcategory_id: string; title: string; youtube_link: string }) => request(`/videos/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteVideo: (id: string) => request(`/videos/${id}`, { method: "DELETE" }),

  // ── Circulars ───────────────────────────────────────────
  getCirculars: () => request<{ id: string; title: string; description: string; attachment_link: string | null; date: string; created_at: string }[]>("/circulars"),
  createCircular: (data: { title: string; description: string; attachment_link?: string }) => request("/circulars", { method: "POST", body: JSON.stringify(data) }),
  deleteCircular: (id: string) => request(`/circulars/${id}`, { method: "DELETE" }),

  // ── Mentorship Categories ───────────────────────────────
  getMentorshipCategories: () => request<{ id: string; name: string }[]>("/mentorship-categories"),
  createMentorshipCategory: (name: string) => request("/mentorship-categories", { method: "POST", body: JSON.stringify({ name }) }),
  deleteMentorshipCategory: (id: string) => request(`/mentorship-categories/${id}`, { method: "DELETE" }),

  // ── Mentees ─────────────────────────────────────────────
  getMentees: () => request<{ id: string; name: string; email: string; phone: string; marks_sheet_link: string | null; category_values: Record<string, string>; created_at: string }[]>("/mentees"),
  createMentee: (data: { name: string; email: string; phone: string; marks_sheet_link?: string; category_values: Record<string, string> }) => request("/mentees", { method: "POST", body: JSON.stringify(data) }),
  updateMentee: (id: string, data: Partial<{ name: string; email: string; phone: string; marks_sheet_link: string; category_values: Record<string, string> }>) => request(`/mentees/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMentee: (id: string) => request(`/mentees/${id}`, { method: "DELETE" }),

  // ── Community ───────────────────────────────────────────
  getPosts: (limit = 20, startAfter?: string) => request<{ id: string; author_name: string; author_avatar: string | null; content: string; image_url: string | null; likes: string[]; comment_count: number; created_at: string }[]>(`/posts?limit=${limit}${startAfter ? `&start_after=${startAfter}` : ""}`),
  createPost: (data: { content: string; image_url?: string }) => request("/posts", { method: "POST", body: JSON.stringify(data) }),
  deletePost: (id: string) => request(`/posts/${id}`, { method: "DELETE" }),
  toggleLike: (id: string) => request<{ liked: boolean }>(`/posts/${id}/like`, { method: "POST" }),
  getComments: (postId: string) => request<{ id: string; post_id: string; author_name: string; content: string; created_at: string }[]>(`/posts/${postId}/comments`),
  addComment: (postId: string, content: string) => request(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ content }) }),
  deleteComment: (id: string) => request(`/comments/${id}`, { method: "DELETE" }),

  // ── Profile ─────────────────────────────────────────────
  updateProfile: (data: { name?: string; phone?: string; profile_picture_url?: string }) => request("/profile", { method: "PUT", body: JSON.stringify(data) }),

  // ── Dashboard ───────────────────────────────────────────
  getDashboardStats: () => request<{ total_notes: number; note_categories: number; total_videos: number; video_categories: number; circulars: number; mentees: number; community_posts: number; total_users: number }>("/dashboard/stats"),
};
