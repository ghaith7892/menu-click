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
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">جارٍ التحقق...</p>
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
