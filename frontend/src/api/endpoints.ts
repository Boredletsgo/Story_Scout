import { API_V1, http, tokenStore } from "./client";
import type {
  Book,
  BookCreatePayload,
  BookDetail,
  ChatRequest,
  ChatResponse,
  DashboardStats,
  Feedback,
  FeedbackPayload,
  LibraryItem,
  LibraryItemCreatePayload,
  LibraryItemUpdatePayload,
  LoginPayload,
  Preference,
  PreferenceUpdatePayload,
  RegisterPayload,
  StreamDonePayload,
  SystemInfo,
  Token,
  User,
  UserUpdatePayload,
} from "./types";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authApi = {
  async register(payload: RegisterPayload): Promise<User> {
    const { data } = await http.post<User>("/auth/register", payload);
    return data;
  },
  async login(payload: LoginPayload): Promise<Token> {
    const { data } = await http.post<Token>("/auth/login", payload);
    tokenStore.set(data);
    return data;
  },
  async me(): Promise<User> {
    const { data } = await http.get<User>("/auth/me");
    return data;
  },
  logout(): void {
    tokenStore.clear();
  },
};

// ---------------------------------------------------------------------------
// Users & preferences
// ---------------------------------------------------------------------------
export const userApi = {
  async me(): Promise<User> {
    const { data } = await http.get<User>("/users/me");
    return data;
  },
  async updateMe(payload: UserUpdatePayload): Promise<User> {
    const { data } = await http.patch<User>("/users/me", payload);
    return data;
  },
  async getPreferences(): Promise<Preference> {
    const { data } = await http.get<Preference>("/users/me/preferences");
    return data;
  },
  async updatePreferences(payload: PreferenceUpdatePayload): Promise<Preference> {
    const { data } = await http.put<Preference>("/users/me/preferences", payload);
    return data;
  },
};

// ---------------------------------------------------------------------------
// Books
// ---------------------------------------------------------------------------
export const bookApi = {
  async list(offset = 0, limit = 24): Promise<Book[]> {
    const { data } = await http.get<Book[]>("/books", { params: { offset, limit } });
    return data;
  },
  async search(q: string, limit = 24): Promise<Book[]> {
    const { data } = await http.get<Book[]>("/books/search", { params: { q, limit } });
    return data;
  },
  async get(id: number): Promise<BookDetail> {
    const { data } = await http.get<BookDetail>(`/books/${id}`);
    return data;
  },
  async similar(id: number, limit = 6): Promise<Book[]> {
    const { data } = await http.get<Book[]>(`/books/${id}/similar`, { params: { limit } });
    return data;
  },
  async create(payload: BookCreatePayload): Promise<Book> {
    const { data } = await http.post<Book>("/books", payload);
    return data;
  },
};

// ---------------------------------------------------------------------------
// Library (reading history)
// ---------------------------------------------------------------------------
export const libraryApi = {
  async list(status?: string): Promise<LibraryItem[]> {
    const { data } = await http.get<LibraryItem[]>("/library", {
      params: status ? { status } : undefined,
    });
    return data;
  },
  async add(payload: LibraryItemCreatePayload): Promise<LibraryItem> {
    const { data } = await http.post<LibraryItem>("/library", payload);
    return data;
  },
  async update(bookId: number, payload: LibraryItemUpdatePayload): Promise<LibraryItem> {
    const { data } = await http.patch<LibraryItem>(`/library/${bookId}`, payload);
    return data;
  },
  async remove(bookId: number): Promise<void> {
    await http.delete(`/library/${bookId}`);
  },
};

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------
export const feedbackApi = {
  async submit(payload: FeedbackPayload): Promise<Feedback> {
    const { data } = await http.post<Feedback>("/feedback", payload);
    return data;
  },
};

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export const dashboardApi = {
  async stats(): Promise<DashboardStats> {
    const { data } = await http.get<DashboardStats>("/dashboard/stats");
    return data;
  },
  async genres(): Promise<Record<string, number>> {
    const { data } = await http.get<Record<string, number>>("/dashboard/genres");
    return data;
  },
  async coach(): Promise<string> {
    const { data } = await http.get<{ message: string }>("/dashboard/coach");
    return data.message;
  },
};

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------
export const systemApi = {
  async info(): Promise<SystemInfo> {
    const { data } = await http.get<SystemInfo>("/info");
    return data;
  },
};

// ---------------------------------------------------------------------------
// Chat (non-streaming + streaming)
// ---------------------------------------------------------------------------
const DONE_MARKER = "[[DONE]]";

export const chatApi = {
  async send(payload: ChatRequest): Promise<ChatResponse> {
    const { data } = await http.post<ChatResponse>("/chat", payload);
    return data;
  },

  /**
   * Stream a chat reply token-by-token.
   *
   * Calls `onToken` for each text chunk as it arrives, then resolves with the
   * structured payload parsed from the trailing `\n[[DONE]]{json}` marker.
   */
  async stream(
    payload: ChatRequest,
    onToken: (chunk: string) => void,
    signal?: AbortSignal,
  ): Promise<StreamDonePayload> {
    const token = tokenStore.access;
    const res = await fetch(`${API_V1}/chat/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...payload, stream: true }),
      signal,
    });

    if (!res.ok || !res.body) {
      let detail = `Request failed (${res.status})`;
      try {
        const body = await res.json();
        if (body?.detail) detail = body.detail;
      } catch {
        /* non-JSON error body */
      }
      throw new Error(detail);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let done: StreamDonePayload = { session_id: "", recommendations: [] };

    // Emit everything up to the DONE marker as visible tokens; parse the rest.
    const flushVisible = () => {
      const idx = buffer.indexOf(DONE_MARKER);
      if (idx === -1) {
        // Keep a small tail in case the marker is split across chunks.
        const safe = buffer.length - DONE_MARKER.length;
        if (safe > 0) {
          onToken(buffer.slice(0, safe));
          buffer = buffer.slice(safe);
        }
        return false;
      }
      const visible = buffer.slice(0, idx).replace(/\n$/, "");
      if (visible) onToken(visible);
      buffer = buffer.slice(idx + DONE_MARKER.length);
      return true;
    };

    let markerSeen = false;
    for (;;) {
      const { value, done: streamDone } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });
      if (!markerSeen) markerSeen = flushVisible();
      if (streamDone) break;
    }
    buffer += decoder.decode();
    if (!markerSeen) markerSeen = flushVisible();

    if (markerSeen) {
      const json = buffer.trim();
      if (json) {
        try {
          done = JSON.parse(json) as StreamDonePayload;
        } catch {
          /* ignore malformed tail */
        }
      }
    } else if (buffer) {
      // No marker arrived — treat remaining buffer as visible text.
      onToken(buffer);
    }

    return done;
  },
};
