import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
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
  // Only label as internet error if the device is actually offline
  if (
    (message.includes("fetch") || message.includes("network") || message.includes("Failed to fetch") ||
     message.includes("NetworkError") || message.includes("Load failed")) &&
    typeof navigator !== "undefined" && !navigator.onLine
  )
    return "انقطع الاتصال مؤقتاً — تأكد من الإنترنت وأعد المحاولة";
  // Supabase cold-start or transient error — don't blame internet
  if (message.includes("timeout") || message.includes("fetch") || message.includes("network") ||
      message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("Load failed"))
    return "تعذّر الاتصال بالخادم — حاول مرة أخرى";
  if (message.includes("Invalid API key") || message.includes("invalid key") || message.includes("apikey"))
    return "مفتاح Supabase غير صحيح — تحقق من VITE_SUPABASE_ANON_KEY";
  return "خطأ: " + message;
}

const ADMIN_EMAIL = "ghaithrajab@yahoo.com";

type RestaurantRow = { id: string; name: string; plan: "free" | "pro" | "enterprise" };

/**
 * Fetch the restaurant for a user — single attempt with 10s timeout.
 * Returns null on timeout/error (dashboard will retry).
 */
async function fetchRestaurantOnce(userId: string): Promise<RestaurantRow | null> {
  try {
    const rpcPromise = supabase.rpc("get_restaurant_by_owner", { p_owner_id: userId }) as unknown as Promise<{
      data: unknown; error: { message: string } | null
    }>;
    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>(resolve =>
      setTimeout(() => resolve({ data: null, error: { message: "timeout" } }), 10_000)
    );
    const res = await Promise.race([rpcPromise, timeoutPromise]);
    if (res.error) console.warn("[auth] get_restaurant_by_owner:", res.error.message);
    const rows = res.data as unknown[] | null;
    return Array.isArray(rows) && rows.length > 0 ? (rows[0] as RestaurantRow) : null;
  } catch (err) {
    console.error("[auth] get_restaurant_by_owner threw:", err);
    return null;
  }
}

/** Build a full user profile. Restaurant data fetched with 10s timeout. */
async function buildUserProfile(authUser: User): Promise<AuthUser> {
  const meta = authUser.user_metadata ?? {};
  const name: string  = (meta.name as string | undefined) || authUser.email?.split("@")[0] || "مستخدم";
  const role: UserRole = authUser.email === ADMIN_EMAIL ? "admin" : "restaurant";

  const result: AuthUser = { id: authUser.id, name, email: authUser.email ?? "", role };

  if (role === "restaurant") {
    const rest = await fetchRestaurantOnce(authUser.id);
    if (rest) {
      result.restaurantId   = rest.id;
      result.restaurantName = rest.name;
      result.plan           = rest.plan;
    }
  }

  return result;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted               = useRef(true);
  // Keep a ref so visibilitychange handler always sees latest user
  const userRef               = useRef<AuthUser | null>(null);
  userRef.current = user;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // ── Retry restaurant fetch when returning to the app ──────────────────────
  // Called when: (a) tab becomes visible, (b) internet restored
  // Only runs if user is logged in but restaurantId is missing
  const retryRestaurant = useCallback(async () => {
    const current = userRef.current;
    if (!current || current.restaurantId || current.role !== "restaurant") return;
    console.debug("[auth] retrying restaurant fetch (visibility/online event)");
    const rest = await fetchRestaurantOnce(current.id);
    if (rest && mounted.current) {
      setUser(prev => prev ? { ...prev, restaurantId: rest.id, restaurantName: rest.name, plan: rest.plan } : prev);
    }
  }, []);

  useEffect(() => {
    // ── 1. Restore session on page load ────────────────────────────────────
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted.current) return;
      if (session?.user) {
        const profile = await buildUserProfile(session.user);
        if (mounted.current) setUser(profile);
      }
      if (mounted.current) setLoading(false);
    });

    // ── 2. Auth state change listener ──────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted.current) return;
        console.debug("[auth] event:", event);

        if (event === "SIGNED_OUT") {
          setUser(null);
          setLoading(false);
          return;
        }

        if (
          (event === "TOKEN_REFRESHED" || event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
          session?.user
        ) {
          const newProfile = await buildUserProfile(session.user);
          if (!mounted.current) return;

          // ⚠️ KEY FIX: If restaurant fetch timed out (cold-start), do NOT
          // overwrite an existing restaurantId with undefined. Keep the
          // previous value — the dashboard will show data correctly.
          setUser(prev => {
            if (!prev) return newProfile;
            return {
              ...newProfile,
              restaurantId:   newProfile.restaurantId   ?? prev.restaurantId,
              restaurantName: newProfile.restaurantName ?? prev.restaurantName,
              plan:           newProfile.plan           ?? prev.plan,
            };
          });
          setLoading(false);
        }
      }
    );

    // ── 3. visibilitychange — re-check session when app comes back to foreground
    // Covers: browser tab switch, phone lock/unlock, PWA resume
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        retryRestaurant();
      }
    };

    // ── 4. online — re-check when internet is restored after being offline
    const handleOnline = () => {
      console.debug("[auth] network restored — retrying restaurant");
      retryRestaurant();
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
    };
  }, [retryRestaurant]);

  // ── Login ─────────────────────────────────────────────────────────────────
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

      let profile = await buildUserProfile(authData.session.user);

      // First-time login after email confirmation: create restaurant only if
      // a pending_restaurant key exists in localStorage (set during register).
      if (profile.role === "restaurant" && !profile.restaurantId) {
        const pendingKey = "pending_restaurant_" + profile.id;
        const pendingRaw = localStorage.getItem(pendingKey);

        if (pendingRaw) {
          let restaurantName = profile.name || "مطعمي";
          let plan: "free" | "pro" = "free";
          try {
            const pending = JSON.parse(pendingRaw) as { name: string; plan: "free" | "pro" };
            if (pending.name) restaurantName = pending.name;
            if (pending.plan) plan = pending.plan;
          } catch { /* ignore */ }
          localStorage.removeItem(pendingKey);

          const { error: restErr } = await supabase.rpc("insert_restaurant", {
            p_id: crypto.randomUUID(),
            p_owner_id: profile.id,
            p_name: restaurantName,
            p_plan: plan,
          });
          if (restErr) console.error("[auth] insert_restaurant:", restErr.message);

          profile = await buildUserProfile(authData.session.user);
        } else {
          console.warn("[auth] login: restaurantId missing (likely timeout) — dashboard will retry");
        }
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

  // ── Register ──────────────────────────────────────────────────────────────
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

  // ── Logout ────────────────────────────────────────────────────────────────
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
