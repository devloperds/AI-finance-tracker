import { create } from "zustand";
import type { User, AuthError } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebase/config";

// Helper function to get user-friendly error messages
const getAuthErrorMessage = (error: unknown): string => {
  if (error && typeof error === "object" && "code" in error) {
    const authError = error as AuthError;
    switch (authError.code) {
      case "auth/invalid-credential":
        return "Invalid email or password. Please check your credentials or sign up for a new account.";
      case "auth/user-not-found":
        return "No account found with this email. Please sign up first.";
      case "auth/wrong-password":
        return "Incorrect password. Please try again.";
      case "auth/email-already-in-use":
        return "This email is already registered. Please sign in instead.";
      case "auth/weak-password":
        return "Password is too weak. Please use at least 6 characters.";
      case "auth/invalid-email":
        return "Invalid email address format.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";
      case "auth/popup-closed-by-user":
        return "Sign-in popup was closed. Please try again.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled. Please contact support.";
      default:
        return authError.message || "An authentication error occurred.";
    }
  }
  return error instanceof Error ? error.message : "An unexpected error occurred.";
};

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  // Actions
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  initialized: false,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),
  clearError: () => set({ error: null }),

  signUp: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      set({ user: userCredential.user, loading: false });
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      set({ user: userCredential.user, loading: false });
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      set({ user: userCredential.user, loading: false });
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut(auth);
      set({ user: null, loading: false });
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  resetPassword: async (email: string) => {
    set({ loading: true, error: null });
    try {
      await sendPasswordResetEmail(auth, email);
      set({ loading: false });
    } catch (error) {
      const errorMessage = getAuthErrorMessage(error);
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
}));

// Initialize auth state listener
export const initializeAuthListener = () => {
  const { setUser, setLoading, setInitialized } = useAuthStore.getState();

  setLoading(true);

  return onAuthStateChanged(auth, (user) => {
    setUser(user);
    setLoading(false);
    setInitialized(true);
  });
};
