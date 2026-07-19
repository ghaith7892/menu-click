import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { LangProvider } from "@/context/lang-context";
import ProtectedRoute from "@/components/protected-route";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import DashboardPage from "@/pages/dashboard";
import CustomerMenuPage from "@/pages/customer-menu";
import AdminPage from "@/pages/admin";

const queryClient = new QueryClient();

function ConfigBanner() {
  const { configured } = useAuth();
  if (configured) return null;
  return (
    <div
      dir="rtl"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: "#dc2626",
        color: "#fff",
        textAlign: "center",
        padding: "10px 16px",
        fontSize: "13px",
        fontFamily: "Cairo, sans-serif",
        fontWeight: 600,
        lineHeight: 1.5,
      }}
    >
      ⚠️ يجب ضبط{" "}
      <code style={{ background: "rgba(0,0,0,0.25)", padding: "1px 6px", borderRadius: 4 }}>
        VITE_SUPABASE_URL
      </code>{" "}
      و{" "}
      <code style={{ background: "rgba(0,0,0,0.25)", padding: "1px 6px", borderRadius: 4 }}>
        VITE_SUPABASE_ANON_KEY
      </code>{" "}
      في Vercel ثم إعادة النشر — لن يعمل تسجيل الدخول بدونها
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/menu/:restaurantId" component={CustomerMenuPage} />

      <Route path="/dashboard">
        <ProtectedRoute role="restaurant">
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute role="admin">
          <AdminPage />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function AppInner() {
  return (
    <TooltipProvider>
      <ConfigBanner />
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LangProvider>
        <AuthProvider>
          <AppInner />
        </AuthProvider>
      </LangProvider>
    </QueryClientProvider>
  );
}

export default App;
