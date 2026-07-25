import { useLocation } from "wouter";
import { useAuth, type UserRole } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  role?: UserRole;
}

export default function ProtectedRoute({ children, role }: Props) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-9 h-9 text-primary animate-spin" />
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-foreground">جارٍ الاتصال…</p>
            <p className="text-xs text-muted-foreground">قد يستغرق الاتصال الأول بضع ثوانٍ</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  if (role && user.role !== role) {
    navigate(user.role === "admin" ? "/admin" : "/dashboard");
    return null;
  }

  return <>{children}</>;
}
