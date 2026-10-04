import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getUserProfile, upsertUser } from "../api";
import { auth } from "../firebase";
import type { Party, UserProfile } from "../types";

interface SignupDetails {
  shopName?: string;
  phone: string;
  location: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string, role: Party, details?: SignupDetails) => Promise<void>;
  signIn: (email: string, password: string, role: Party) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (nextUser) {
        try {
          setProfile(await getUserProfile(nextUser.uid));
        } catch {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  const value: AuthContextValue = {
    user,
    profile,
    loading,
    signUp: async (email, password, name, role, details) => {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(credential.user, { displayName: name });
      setProfile(await upsertUser({ uid: credential.user.uid, email, name, role, ...details }));
    },
    signIn: async (email, password, role) => {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      setProfile(
        await upsertUser({
          uid: credential.user.uid,
          email: credential.user.email ?? email,
          name: credential.user.displayName ?? "",
          role,
        })
      );
    },
    logOut: () => signOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
