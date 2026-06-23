// Shared API types mirroring the backend Pydantic schemas (app/schemas/*).

export interface Token {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  reading_level: string | null;
  preferred_length: string | null;
  reading_goal_books: number;
  reading_streak_days: number;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  full_name?: string | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserUpdatePayload {
  full_name?: string | null;
  reading_level?: string | null;
  preferred_length?: string | null;
  reading_goal_books?: number | null;
}

export interface PreferenceUpdatePayload {
  favorite_genres?: string[] | null;
  preferred_moods?: string[] | null;
  preferred_pacing?: string | null;
  favorite_themes?: string[] | null;
  disliked_tropes?: string[] | null;
  reading_goals?: string[] | null;
}

export interface Preference {
  favorite_genres: string[];
  preferred_moods: string[];
  preferred_pacing: string | null;
  favorite_themes: string[];
  disliked_tropes: string[];
  reading_goals: string[];
  profile_summary: string | null;
}

export interface Genre {
  id: number;
  name: string;
  slug: string;
}

export interface Author {
  id: number;
  name: string;
  bio: string | null;
  photo_url: string | null;
}

export interface Book {
  id: number;
  title: string;
  subtitle: string | null;
  cover_url: string | null;
  description: string | null;
  mood: string | null;
  pacing: string | null;
  average_rating: number;
  ratings_count: number;
  published_year: number | null;
  page_count: number | null;
  author: Author | null;
  genres: Genre[];
}

export interface BookDetail extends Book {
  isbn: string | null;
  themes: string | null;
  tropes: string | null;
  similar_books: Book[];
}

export interface BookCreatePayload {
  title: string;
  subtitle?: string | null;
  isbn?: string | null;
  description?: string | null;
  cover_url?: string | null;
  author_name?: string | null;
  genres?: string[];
  mood?: string | null;
  pacing?: string | null;
  themes?: string | null;
  tropes?: string | null;
  page_count?: number | null;
  published_year?: number | null;
  average_rating?: number;
  ratings_count?: number;
}

export type ReadingStatus = "want_to_read" | "currently_reading" | "read";

export interface LibraryItem {
  id: number;
  status: ReadingStatus;
  progress_percent: number;
  user_rating: number | null;
  started_at: string | null;
  finished_at: string | null;
  book: Book;
}

export interface LibraryItemCreatePayload {
  book_id: number;
  status?: ReadingStatus;
}

export interface LibraryItemUpdatePayload {
  status?: ReadingStatus | null;
  progress_percent?: number | null;
  user_rating?: number | null;
}

export type FeedbackType = "up" | "down";

export interface FeedbackPayload {
  book_id: number;
  feedback_type: FeedbackType;
  reason?: string | null;
}

export interface Feedback {
  id: number;
  book_id: number;
  feedback_type: FeedbackType;
  reason: string | null;
}

export interface RecommendationItem {
  book: Book;
  score: number;
  reasoning: string;
}

export interface ExtractedPreferences {
  genre: string | null;
  tone: string | null;
  pacing: string | null;
  themes: string[];
  tropes: string[];
  disliked_tropes: string[];
  reading_goals: string[];
  similar_to: string[];
  needs_clarification: boolean;
  clarifying_question: string | null;
}

export interface ChatMessagePayload {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatRequest {
  message: string;
  session_id?: string | null;
  history?: ChatMessagePayload[];
  stream?: boolean;
}

export interface ChatResponse {
  session_id: string;
  message: string;
  recommendations: RecommendationItem[];
  extracted_preferences: ExtractedPreferences | null;
}

/** Payload carried after the `[[DONE]]` marker in the streaming response. */
export interface StreamDonePayload {
  session_id: string;
  recommendations: RecommendationItem[];
}

export interface DashboardStats {
  books_read: number;
  currently_reading: number;
  want_to_read: number;
  reading_streak_days: number;
  reading_goal_books: number;
  goal_progress_percent: number;
  favorite_genres: string[];
  recommendation_accuracy: number;
  total_feedback: number;
}

export interface SystemInfo {
  project: string;
  llm_provider: string;
  llm_model: string;
  llm_requires_key: boolean;
  llm_key_present: boolean;
  embedding_model: string;
  indexed_books: number;
  mlflow_enabled: boolean;
}

export interface ApiErrorBody {
  detail: string;
  code?: string;
}

