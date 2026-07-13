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
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string; needsConfirmation?: boolean }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function translateSupabaseError(message: string): string {
  if (message.includes("Invalid login credentials") || message.includes("invalid_credentials"))
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة";
  if (message.includes("Email not confirmed"))
    return "يرجى تأكيد بريدك الإلكتروني أولاً — تحقق من صندوق الوارد";
  if (message.includes("User already registered") || message.includes("already been registered"))
    return "هذا البريد الإلكتروني مسجّل مسبقاً";
  if (message.includes("Password should be at least"))
    return "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
  if (message.includes("Unable to validate email address"))
    return "صيغة البريد الإلكتروني غير صحيحة";
  if (message.includes("signup is disabled") || message.includes("Signups not allowed"))
    return "التسجيل مغلق حالياً، يرجى المحاولة لاحقاً";
  if (message.includes("rate limit") || message.includes("too many requests"))
    return "طلبات كثيرة، يرجى الانتظار دقيقة والمحاولة مجدداً";
  if (message.includes("network") || message.includes("fetch"))
    return "خطأ في الاتصال بالشبكة، تحقق من اتصالك بالإنترنت";
  return message;
}

async function fetchUserProfile(userId: string): Promise<AuthUser | null> {
  try {
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
  } catch {
    return null;
  }
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
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: translateSupabaseError(error.message) };
      }
      if (!authData.session) {
        return { success: false, error: "يرجى تأكيد بريدك الإلكتروني أولاً — تحقق من صندوق الوارد" };
      }
      const profile = await fetchUserProfile(authData.session.user.id);
      return { success: true, role: profile?.role };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
      return { success: false, error: translateSupabaseError(msg) };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.ownerName,
            role: "restaurant",
          },
        },
      });

      if (signUpError) {
        return { success: false, error: translateSupabaseError(signUpError.message) };
      }

      const userId = authData.user?.id;
      if (!userId) return { success: false, error: "حدث خطأ غير متوقع أثناء إنشاء الحساب" };

      const needsConfirmation = !authData.session;

      if (!needsConfirmation) {
        await new Promise(r => setTimeout(r, 500));

        const { error: restaurantError } = await supabase.from("restaurants").insert({
          id: crypto.randomUUID(),
          owner_id: userId,
          name: data.restaurantName,
          plan: data.plan,
          tables_count: 5,
        } as Record<string, unknown>);

        if (restaurantError) {
          console.warn("Restaurant insert error:", restaurantError.message);
        }
      }

      return { success: true, needsConfirmation };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
      return { success: false, error: translateSupabaseError(msg) };
    }
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
