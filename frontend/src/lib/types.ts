// ── User ──────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "student";
  profile_picture_url: string | null;
}

// ── Notes: Category → Subcategory → Note ──────────────────
export interface NoteCategory {
  id: string;
  name: string;
}

export interface NoteSubcategory {
  id: string;
  category_id: string;
  name: string;
}

export interface Note {
  id: string;
  subcategory_id: string;
  title: string;
  drive_link: string;
  created_at: string;
}

// ── Video Links: same hierarchy ───────────────────────────
export interface VideoCategory {
  id: string;
  name: string;
}

export interface VideoSubcategory {
  id: string;
  category_id: string;
  name: string;
}

export interface VideoLink {
  id: string;
  subcategory_id: string;
  title: string;
  youtube_link: string;
  created_at: string;
}

// ── Circulars ─────────────────────────────────────────────
export interface Circular {
  id: string;
  title: string;
  description: string;
  attachment_link: string | null;
  date: string;
  created_at: string;
}

// ── Mentorship ────────────────────────────────────────────
export interface MentorshipCategory {
  id: string;
  name: string;
}

export interface MenteeStudent {
  id: string;
  name: string;
  email: string;
  phone: string;
  marks_sheet_link: string | null;
  category_values: Record<string, string>;
  created_at: string;
}

// ── Community ─────────────────────────────────────────────
export interface Post {
  id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  image_url: string | null;
  likes: string[];  // always an array from API
  comment_count: number;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

// ── Dashboard Stats ───────────────────────────────────────
export interface DashboardStats {
  total_notes: number;
  note_categories: number;
  total_videos: number;
  video_categories: number;
  circulars: number;
  mentees: number;
  community_posts: number;
  total_users: number;
}
