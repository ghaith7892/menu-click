import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '@/lib/supabase';
import { getRestaurantByOwner } from '@/lib/api';
import type { RestaurantRow } from '@/lib/types';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  restaurantId?: string;
  restaurantName?: string;
  plan?: RestaurantRow['plan'];
  currency?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function translateError(message: string): string {
  if (message.includes('Invalid login credentials') || message.includes('invalid_credentials'))
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
  if (message.includes('Email not confirmed'))
    return 'يرجى تأكيد بريدك الإلكتروني أولاً';
  if (message.includes('rate limit') || message.includes('too many requests'))
    return 'كثرة المحاولات — انتظر دقيقة ثم أعد المحاولة';
  if (message.includes('timeout') || message.includes('fetch') || message.includes('network'))
    return 'تعذّر الاتصال بالخادم — حاول مرة أخرى';
  return 'خطأ: ' + message;
}

async function buildProfile(authUser: User): Promise<AuthUser> {
  const meta = authUser.user_metadata ?? {};
  const name = (meta.name as string | undefined) || authUser.email?.split('@')[0] || 'مستخدم';
  const result: AuthUser = { id: authUser.id, name, email: authUser.email ?? '' };

  const rest = await getRestaurantByOwner(authUser.id);
  if (rest) {
    result.restaurantId = rest.id;
    result.restaurantName = rest.name;
    result.plan = rest.plan;
    result.currency = rest.currency;
  }
  return result;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    // Restore session on mount
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted.current) return;
      if (error) {
        const isInvalidToken =
          error.message?.toLowerCase().includes('refresh token') ||
          error.message?.toLowerCase().includes('invalid token');
        if (isInvalidToken) await supabase.auth.signOut();
        setLoading(false);
        return;
      }
      if (session?.user) {
        const profile = await buildProfile(session.user);
        if (mounted.current) setUser(profile);
      }
      if (mounted.current) setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;
      if (event === 'SIGNED_OUT') { setUser(null); setLoading(false); return; }
      if (event === 'TOKEN_REFRESHED' && !session) {
        await supabase.auth.signOut();
        if (mounted.current) { setUser(null); setLoading(false); }
        return;
      }
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        const profile = await buildProfile(session.user);
        if (!mounted.current) return;
        setUser((prev) => {
          if (!prev) return profile;
          return {
            ...profile,
            restaurantId: profile.restaurantId ?? prev.restaurantId,
            restaurantName: profile.restaurantName ?? prev.restaurantName,
            plan: profile.plan ?? prev.plan,
            currency: profile.currency ?? prev.currency,
          };
        });
        setLoading(false);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  const login = async (email: string, password: string) => {
    if (!supabaseConfigured) {
      return { success: false, error: 'التطبيق غير مُهيَّأ: تحقق من إعدادات Supabase' };
    }
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, error: translateError(error.message) };
      if (!authData.session) return { success: false, error: 'يرجى تأكيد بريدك الإلكتروني أولاً' };
      const profile = await buildProfile(authData.session.user);
      if (mounted.current) { setUser(profile); setLoading(false); }
      return { success: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'خطأ غير متوقع';
      return { success: false, error: translateError(msg) };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, configured: supabaseConfigured, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
