import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type UserRole = "admin" | "restaurant";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  restaurantId?: string;
  restaurantName?: string;
  plan?: "free" | "pro" | "enterprise";
  avatar?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export interface RegisterData {
  ownerName: string;
  restaurantName: string;
  email: string;
  password: string;
  plan: "free" | "pro";
}

const MOCK_USERS: { email: string; password: string; user: AuthUser }[] = [
  {
    email: "admin@qrmenu.sa",
    password: "admin123",
    user: {
      id: "user-admin",
      name: "مدير المنصة",
      email: "admin@qrmenu.sa",
      role: "admin",
    },
  },
  {
    email: "ahmed@nakhba.sa",
    password: "password123",
    user: {
      id: "user-1",
      name: "أحمد الزهراني",
      email: "ahmed@nakhba.sa",
      role: "restaurant",
      restaurantId: "rest-1",
      restaurantName: "مطعم النخبة",
      plan: "pro",
    },
  },
  {
    email: "sara@bareeq.sa",
    password: "password123",
    user: {
      id: "user-2",
      name: "سارة القحطاني",
      email: "sara@bareeq.sa",
      role: "restaurant",
      restaurantId: "rest-2",
      restaurantName: "كافيه بريق",
      plan: "pro",
    },
  },
];

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "qrmenu_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {}
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    await new Promise(r => setTimeout(r, 900));
    const match = MOCK_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!match) {
      return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }
    setUser(match.user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(match.user));
    return { success: true };
  };

  const register = async (data: RegisterData) => {
    await new Promise(r => setTimeout(r, 1200));
    const exists = MOCK_USERS.find(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) return { success: false, error: "هذا البريد الإلكتروني مسجّل مسبقاً" };

    const newUser: AuthUser = {
      id: `user-${Date.now()}`,
      name: data.ownerName,
      email: data.email,
      role: "restaurant",
      restaurantId: `rest-${Date.now()}`,
      restaurantName: data.restaurantName,
      plan: data.plan,
    };
    setUser(newUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
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
