import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Family, FamilyMember } from "@planify-kids/types";

interface AuthUser {
  id: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  family: Family | null;
  member: FamilyMember | null;
  setAuth: (payload: {
    token: string;
    user: AuthUser;
    family: Family;
    member: FamilyMember;
  }) => void;
  setFamily: (family: Pick<Family, "id" | "name">) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      family: null,
      member: null,
      setAuth: ({ token, user, family, member }) =>
        set({ token, user, family, member }),
      setFamily: (updated) =>
        set((s) => ({ family: s.family ? { ...s.family, ...updated } : null })),
      logout: () =>
        set({ token: null, user: null, family: null, member: null }),
      isAuthenticated: () => get().token !== null,
    }),
    { name: "auth-store" },
  ),
);
