import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export type UserRole = "admin" | "restaurant";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  restaurantId?: string;
  restaurantName?: string;
  plan?: "free" | "pro" | "enterprise";
}

export interface RegisterData {
  ownerName: string;
  restaurantName: string;
  email: string;
  password: string;
  plan: "free" | "pro";
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchUserProfile(userId: string): Promise<AuthUser | null> {
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) return null;

  const result: AuthUser = {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
  };

  if (profile.role === "restaurant") {
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id, name, plan")
      .eq("owner_id", userId)
      .single();

    if (restaurant) {
      result.restaurantId = restaurant.id;
      result.restaurantName = restaurant.name;
      result.plan = restaurant.plan;
    }
  }

  return result;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) await loadUser(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session) {
          await loadUser(session);
        } else {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUser = async (session: Session) => {
    const profile = await fetchUserProfile(session.user.id);
    setUser(profile);
  };

  const login = async (email: string, password: string) => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message.includes("Invalid")
        ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        : error.message;
      return { success: false, error: msg };
    }
    const profile = authData.session ? await fetchUserProfile(authData.session.user.id) : null;
    return { success: true, role: profile?.role };
  };

  const register = async (data: RegisterData) => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (signUpError) {
      const msg = signUpError.message.includes("already")
        ? "هذا البريد الإلكتروني مسجّل مسبقاً"
        : signUpError.message;
      return { success: false, error: msg };
    }

    const userId = authData.user?.id;
    if (!userId) return { success: false, error: "حدث خطأ غير متوقع" };

    const { error: profileError } = await supabase.from("users").insert({
      id: userId,
      name: data.ownerName,
      email: data.email,
      role: "restaurant",
    });

    if (profileError) return { success: false, error: "فشل إنشاء الملف الشخصي" };

    const { error: restaurantError } = await supabase.from("restaurants").insert({
      id: crypto.randomUUID(),
      owner_id: userId,
      name: data.restaurantName,
      plan: data.plan,
      tables_count: 5,
    });

    if (restaurantError) return { success: false, error: "فشل إنشاء بيانات المطعم" };

    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
