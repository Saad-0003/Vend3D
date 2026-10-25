"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { authService } from "@/lib/auth/service";
import type { AuthUser } from "@/lib/auth/schemas";
/**
 * Auth session mirror (plan.md Phase 3, DECISIONS.md D-051).
 *
 * Phase 3 makes the server the source of truth — Supabase session cookies,
 * `middleware.ts` refresh and `requireUser()` on every action. Until then this
 * store holds the signed-in user so the navbar, the dialog, the guard and the
 * full pages all agree on one state.
 *
 * It is the *only* thing the UI touches: the actions below are the same four
 * the real service exposes, so the swap is this file's body and nothing else.
 */

export type { AuthUser };

type AuthState = {
  user: AuthUser | null;
  /** False until localStorage has been read, so the UI never flashes signed-out. */
  hydrated: boolean;
  /** True while a sign-in or sign-up request is in flight. */
  pending: boolean;
  /**
   * True when a session existed but its expiry has passed (mock TTL, D-093).
   * Distinct from signed-out so the guards can show the recovery dialog that
   * returns the shopper to the screen they were on, instead of a flat redirect.
   */
  expired: boolean;
};

type AuthActions = {
  /** Returns true on success so callers can navigate or close their dialog. */
  signIn: (input: { email: string; password: string }) => Promise<boolean>;
  signUp: (input: { email: string; password: string; name: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
  hydrate: () => Promise<void>;
};

/**
 * Adopts a successful result. Preferring what actually persisted matters: the
 * guard and `hydrate()` both read storage, so the store must hold the identity
 * the rest of the app will see. The fallback covers a storage write that was
 * lost (a full quota), where the session cannot be read back. A fresh session
 * also clears any expired flag a guard may have tripped.
 */
function adoptSession(set: (partial: Partial<AuthState>) => void, user: AuthUser): void {
  set({ user: authService.getCurrentUser() ?? user, expired: false });
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      hydrated: false,
      pending: false,
      expired: false,

      async signIn(input) {
        set({ pending: true });
        try {
          const result = await authService.signIn(input);
          if (!result.ok) return false;
          adoptSession(set, result.user);
          return true;
        } finally {
          set({ pending: false });
        }
      },

      async signUp(input) {
        set({ pending: true });
        try {
          const result = await authService.signUp(input);
          if (!result.ok) return false;
          adoptSession(set, result.user);
          return true;
        } finally {
          set({ pending: false });
        }
      },

      async signOut() {
        set({ pending: true });
        try {
          await authService.signOut();
          set({ user: null, expired: false });
        } finally {
          set({ pending: false });
        }
      },

      async hydrate() {
        if (get().hydrated) return;
        // Let the persisted partial land before the service read: the store's
        // own persisted snapshot can be stale (e.g. a role rewritten in the
        // service session), and `getSessionState` must be the final word.
        await useAuthStore.persist.rehydrate();
        // `getSessionState` — not just `getCurrentUser` — so an expired session
        // surfaces as the recovery dialog, not as a silent signed-out state.
        const state = authService.getSessionState();
        if (state.status === "active") {
          set({ user: authService.getCurrentUser() ?? state.user, expired: false, hydrated: true });
        } else {
          set({ user: null, expired: state.status === "expired", hydrated: true });
        }
      },
    }),
    {
      name: "vend3d-auth",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // Only the persisted session. `pending` is per-visit.
      partialize: (s) => ({ user: s.user }),
    },
  ),
);
