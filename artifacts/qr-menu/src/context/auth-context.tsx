import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "@/lib/supabase";

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
  logout: () => Promise<void>;
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
    return "التسجيل مغلق حالياً — تحقق من إعدادات Supabase";
  if (message.includes("rate limit") || message.includes("too many requests") || message.includes("429"))
    return "كثرة المحاولات — انتظر دقيقة ثم أعد المحاولة";
  if (message.includes("fetch") || message.includes("network") || message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("Load failed"))
    return "انقطع الاتصال مؤقتاً — تأكد من الإنترنت وأعد المحاولة";
  if (message.includes("Invalid API key") || message.includes("invalid key") || message.includes("apikey"))
    return "مفتاح Supabase غير صحيح — تحقق من VITE_SUPABASE_ANON_KEY";
  return "خطأ: " + message;
}

// Build profile from an already-known Supabase User object — NO extra network call needed
async function buildUserProfile(authUser: User): Promise<AuthUser> {
  const meta = authUser.user_metadata ?? {};
  const name: string  = (meta.name  as string | undefined) || authUser.email?.split("@")[0] || "مستخدم";
  const role: UserRole = (meta.role  as string | undefined) === "admin" ? "admin" : "restaurant";

  const result: AuthUser = { id: authUser.id, name, email: authUser.email ?? "", role };

  if (role === "restaurant") {
    // 8-second timeout so login never hangs indefinitely
    const rpcPromise = supabase.rpc("get_restaurant_by_owner", { p_owner_id: authUser.id }) as unknown as Promise<{ data: unknown; error: { message: string } | null }>;
    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>(resolve =>
      setTimeout(() => resolve({ data: null, error: { message: "timeout: get_restaurant_by_owner" } }), 8000)
    );
    const res = await Promise.race([rpcPromise, timeoutPromise]);
    const rpcRows = res.data as unknown[] | null;
    const rest = Array.isArray(rpcRows) && rpcRows.length > 0
      ? (rpcRows[0] as { id: string; name: string; plan: "free" | "pro" | "enterprise" })
      : null;
    if (rest) {
      result.restaurantId   = rest.id;
      result.restaurantName = rest.name;
      result.plan           = rest.plan;
    } else if (res.error) {
      console.error("[auth] get_restaurant_by_owner:", res.error.message);
    }
  }

  return result;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted               = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    // Restore session on page load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted.current) return;
      if (session?.user) {
        const profile = await buildUserProfile(session.user);
        if (mounted.current) setUser(profile);
      }
      if (mounted.current) setLoading(false);
    });

    // Listen for session changes (e.g. token refresh, sign-out from another tab)
    // We skip SIGNED_IN here because login() handles that path directly and faster
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted.current) return;
        if (event === "SIGNED_OUT") {
          setUser(null);
          setLoading(false);
        } else if (event === "TOKEN_REFRESHED" && session?.user) {
          const profile = await buildUserProfile(session.user);
          if (mounted.current) setUser(profile);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    if (!supabaseConfigured) {
      return {
        success: false,
        error: "التطبيق غير مُهيَّأ: يرجى ضبط VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في متغيرات البيئة",
      };
    }

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) return { success: false, error: translateSupabaseError(error.message) };
      if (!authData.session) {
        return { success: false, error: "يرجى تأكيد بريدك الإلكتروني أولاً — تحقق من صندوق الوارد" };
      }

      // Use the user object already returned — no second auth.getUser() call needed
      let profile = await buildUserProfile(authData.session.user);

      // First-time login after email confirmation: create restaurant if missing
      if (profile.role === "restaurant" && !profile.restaurantId) {
        const pendingKey = "pending_restaurant_" + profile.id;
        const pendingRaw = localStorage.getItem(pendingKey);
        let restaurantName = profile.name ? profile.name : "مطعمي";
        let plan: "free" | "pro" = "free";

        if (pendingRaw) {
          try {
            const pending = JSON.parse(pendingRaw) as { name: string; plan: "free" | "pro" };
            if (pending.name) restaurantName = pending.name;
            if (pending.plan) plan = pending.plan;
          } catch { /* ignore */ }
          localStorage.removeItem(pendingKey);
        }

        await supabase.rpc("insert_restaurant", {
          p_id: crypto.randomUUID(),
          p_owner_id: profile.id,
          p_name: restaurantName,
          p_plan: plan,
        });

        // Re-build to get restaurantId
        profile = await buildUserProfile(authData.session.user);
      }

      if (mounted.current) {
        setUser(profile);
        setLoading(false);
      }

      return { success: true, role: profile.role };

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
        options: { data: { name: data.ownerName, role: "restaurant" } },
      });

      if (signUpError) return { success: false, error: translateSupabaseError(signUpError.message) };

      const userId = authData.user?.id;
      if (!userId) return { success: false, error: "حدث خطأ غير متوقع — لم يُعَد معرّف المستخدم" };

      const needsConfirmation = !authData.session;

      if (!needsConfirmation && authData.session) {
        await new Promise(r => setTimeout(r, 800));

        const { error: restErr } = await supabase.rpc("insert_restaurant", {
          p_id: crypto.randomUUID(),
          p_owner_id: userId,
          p_name: data.restaurantName,
          p_plan: data.plan,
        });
        if (restErr) console.error("[auth] insert_restaurant:", restErr.message);

        const profile = await buildUserProfile(authData.session.user);
        if (mounted.current) {
          setUser(profile);
          setLoading(false);
        }
      } else {
        localStorage.setItem(
          "pending_restaurant_" + userId,
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
