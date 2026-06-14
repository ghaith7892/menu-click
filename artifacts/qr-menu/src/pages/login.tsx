import { useState } from "react";
import { useLocation } from "wouter";
import { QrCode, Eye, EyeOff, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Link } from "wouter";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("يرجى تعبئة جميع الحقول"); return; }
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      if (result.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    } else {
      setError(result.error || "حدث خطأ، حاول مرة أخرى");
    }
  };

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col w-[45%] bg-primary relative overflow-hidden p-12">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-purple-900" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        <div className="relative flex flex-col h-full">
          <div className="mb-auto">
            <div className="inline-block bg-white rounded-2xl px-3 py-1.5 shadow-sm">
              <img src="/menuclick-logo.jpg" alt="MenuClick" className="h-8 w-auto object-contain" />
            </div>
          </div>
          <div className="mb-auto">
            <h2 className="text-4xl font-black text-white leading-tight mb-5">
              أدِر مطعمك
              <br />
              بذكاء أكثر
            </h2>
            <p className="text-white/70 text-base leading-relaxed">
              منيو رقمي احترافي، استقبال طلبات مباشرة، وتحليلات دقيقة — كل شيء في لوحة تحكم واحدة.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { icon: "🍽️", title: "مطعم النخبة", desc: "منيو رقمي متكامل مع 12 طاولة" },
              { icon: "☕", title: "كافيه بريق",  desc: "استقبال طلبات مباشرة لحظياً" },
            ].map(card => (
              <div key={card.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 flex items-center gap-3 border border-white/10">
                <span className="text-2xl">{card.icon}</span>
                <div>
                  <p className="font-bold text-white text-sm">{card.title}</p>
                  <p className="text-white/60 text-xs">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Back button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8 group"
          >
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            رجوع
          </button>

          {/* Logo (mobile only) */}
          <div className="mb-8 lg:hidden">
            <img src="/menuclick-logo.jpg" alt="MenuClick" className="h-10 w-auto object-contain rounded-xl" />
          </div>

          <h1 className="text-2xl font-black text-foreground mb-1">أهلاً بك مجدداً 👋</h1>
          <p className="text-muted-foreground text-sm mb-8">سجّل دخولك لإدارة مطعمك</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@restaurant.sa"
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">كلمة المرور</label>
                <button type="button" className="text-xs text-primary hover:underline font-medium">نسيت كلمة المرور؟</button>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-4 pl-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:brightness-110 disabled:opacity-70 transition-all shadow-sm flex items-center justify-center gap-2 text-sm"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ التحقق...</> : "تسجيل الدخول"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            ليس لديك حساب؟{" "}
            <Link href="/register" className="text-primary font-bold hover:underline">
              أنشئ حساباً مجاناً
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
