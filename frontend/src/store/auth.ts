import { create } from "zustand";

import { authApi } from "@/api/endpoints";
import { tokenStore } from "@/api/client";
import type { LoginPayload, RegisterPayload, User } from "@/api/types";

interface AuthState {
  user: User | null;
  status: "idle" | "loading" | "authenticated" | "unauthenticated";
  bootstrap: () => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",

  async bootstrap() {
    if (!tokenStore.access) {
      set({ status: "unauthenticated", user: null });
      return;
    }
    set({ status: "loading" });
    try {
      const user = await authApi.me();
      set({ user, status: "authenticated" });
    } catch {
      tokenStore.clear();
      set({ user: null, status: "unauthenticated" });
    }
  },

  async login(payload) {
    await authApi.login(payload);
    const user = await authApi.me();
    set({ user, status: "authenticated" });
  },

  async register(payload) {
    const user = await authApi.register(payload);
    // Auto-login after successful registration.
    await authApi.login({ email: payload.email, password: payload.password });
    const me = await authApi.me();
    set({ user: me, status: "authenticated" });
    return user;
  },

  logout() {
    authApi.logout();
    set({ user: null, status: "unauthenticated" });
  },

  setUser(user) {
    set({ user });
  },
}));
