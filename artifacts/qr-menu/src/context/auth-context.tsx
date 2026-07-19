import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
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
  configured: boolean;
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
  if (message.includes("User already registered") || message.includes("already been registered") || message.includes("already registered"))
    return "هذا البريد الإلكتروني مسجّل مسبقاً";
  if (message.includes("Password should be at least"))
    return "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
  if (message.includes("Unable to validate email address"))
    return "صيغة البريد الإلكتروني غير صحيحة";
  if (message.includes("signup is disabled") || message.includes("Signups not allowed"))
    return "التسجيل مغلق حالياً — تحقق من إعدادات Supabase → Authentication → Providers";
  if (message.includes("rate limit") || message.includes("too many requests"))
    return "طلبات كثيرة، يرجى الانتظار دقيقة والمحاولة مجدداً";
  if (message.includes("fetch") || message.includes("network") || message.includes("Failed to fetch") || message.includes("NetworkError"))
    return "تعذّر الاتصال بالخادم — تأكد من إعداد VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY بشكل صحيح";
  if (message.includes("Invalid API key") || message.includes("invalid key") || message.includes("apikey"))
    return "مفتاح Supabase غير صحيح — تحقق من VITE_SUPABASE_ANON_KEY";
  return `خطأ: ${message}`;
}

async function fetchUserProfile(userId: string): Promise<AuthUser | null> {
  try {
    let { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    // If profile doesn't exist yet (trigger may not have fired for old accounts),
    // create it from the auth user data
    if (!profile) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      const name =
        (authUser.user_metadata?.name as string | undefined) ||
        authUser.email?.split("@")[0] ||
        "مستخدم";
      const role =
        (authUser.user_metadata?.role as string | undefined) || "restaurant";

      await supabase.from("users").upsert({
        id: authUser.id,
        name,
        email: authUser.email ?? "",
        role,
      });

      const { data: created } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      profile = created;
    }

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

async function createRestaurantForUser(userId: string, name: string, plan: "free" | "pro" = "free") {
  const { error } = await supabase.from("restaurants").insert({
    id: crypto.randomUUID(),
    owner_id: userId,
    name,
    plan,
    tables_count: 5,
  });
  return error;
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
    if (!supabaseConfigured) {
      return {
        success: false,
        error: "التطبيق غير مُهيَّأ: يرجى ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في متغيرات البيئة",
      };
    }

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { success: false, error: translateSupabaseError(error.message) };
      }
      if (!authData.session) {
        return { success: false, error: "يرجى تأكيد بريدك الإلكتروني أولاً — تحقق من صندوق الوارد" };
      }

      const userId = authData.session.user.id;
      let profile = await fetchUserProfile(userId);

      if (profile?.role === "restaurant" && !profile.restaurantId) {
        const pendingKey = `pending_restaurant_${userId}`;
        const pendingRaw = localStorage.getItem(pendingKey);
        let restaurantName = profile.name ? `مطعم ${profile.name}` : "مطعمي";
        let plan: "free" | "pro" = "free";

        if (pendingRaw) {
          try {
            const pending = JSON.parse(pendingRaw) as { name: string; plan: "free" | "pro" };
            if (pending.name) restaurantName = pending.name;
            if (pending.plan) plan = pending.plan;
          } catch { /* ignore */ }
          localStorage.removeItem(pendingKey);
        }

        await createRestaurantForUser(userId, restaurantName, plan);
        profile = await fetchUserProfile(userId);
      }

      return { success: true, role: profile?.role };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
      return { success: false, error: translateSupabaseError(msg) };
    }
  };

  const register = async (data: RegisterData) => {
    if (!supabaseConfigured) {
      return {
        success: false,
        error: "التطبيق غير مُهيَّأ: يرجى ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في متغيرات البيئة",
      };
    }

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
      if (!userId) {
        return { success: false, error: "حدث خطأ غير متوقع أثناء إنشاء الحساب — لم يُعَد معرّف المستخدم" };
      }

      const needsConfirmation = !authData.session;

      if (!needsConfirmation) {
        await new Promise(r => setTimeout(r, 800));

        const restaurantError = await createRestaurantForUser(userId, data.restaurantName, data.plan);

        if (restaurantError) {
          console.error("Restaurant insert error:", restaurantError.message, restaurantError.code);
          if (restaurantError.message.includes("violates row-level security") || restaurantError.code === "42501") {
            return {
              success: false,
              error: "خطأ في صلاحيات قاعدة البيانات — تأكد من تشغيل SQL script كاملاً في Supabase",
            };
          }
        }
      } else {
        localStorage.setItem(
          `pending_restaurant_${userId}`,
          JSON.stringify({ name: data.restaurantName, plan: data.plan })
        );
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
    <AuthContext.Provider value={{ user, loading, configured: supabaseConfigured, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
