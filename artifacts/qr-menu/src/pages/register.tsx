import { useState } from "react";
import { useLocation, Link } from "wouter";
import {
  QrCode, Eye, EyeOff, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, Check, Store, User, Mail, Lock, Zap
} from "lucide-react";
import { useAuth, type RegisterData } from "@/context/auth-context";

type Step = 1 | 2 | 3;

const STEPS = [
  { id: 1, label: "معلومات المطعم" },
  { id: 2, label: "بيانات الحساب" },
  { id: 3, label: "اختر خطتك" },
];

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const { register } = useAuth();

  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState<RegisterData>({
    ownerName: "",
    restaurantName: "",
    email: "",
    password: "",
    plan: "free",
  });

  const update = (field: keyof RegisterData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.restaurantName.trim()) return "يرجى إدخال اسم المطعم";
      if (!form.ownerName.trim()) return "يرجى إدخال اسم المالك";
      return null;
    }
    if (step === 2) {
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
        return "يرجى إدخال بريد إلكتروني صحيح";
      if (form.password.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
      return null;
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    if (step < 3) setStep((step + 1) as Step);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const result = await register(form);
    setLoading(false);
    if (result.success) navigate("/dashboard");
    else setError(result.error || "حدث خطأ، حاول مرة أخرى");
  };

  const plans = [
    {
      id: "free" as const,
      name: "مجاني",
      price: "0",
      icon: "🎁",
      features: ["منيو واحد", "حتى 20 صنف", "QR code واحد"],
    },
    {
      id: "pro" as const,
      name: "احترافي",
      price: "49",
      icon: "⭐",
      badge: "الأشهر",
      features: ["منيو غير محدود", "QR لكل طاولة", "طلبات مباشرة", "إحصائيات"],
    },
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Logo */}
        <div className="flex items-center justify-center mb-10">
          <img src="/menuclick-logo.jpg" alt="MenuClick" className="h-12 w-auto object-contain rounded-xl" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-10">
          {STEPS.map((s, idx) => (
            <div key={s.id} className="flex items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                  step > s.id ? "bg-primary text-white" :
                  step === s.id ? "bg-primary text-white shadow-md ring-4 ring-primary/20" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${step === s.id ? "text-primary" : "text-muted-foreground"}`}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 w-16 sm:w-24 mx-2 mt-[-12px] rounded-full transition-all ${step > s.id ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-accent/30">
            <h2 className="font-black text-lg text-foreground">
              {step === 1 ? "أخبرنا عن مطعمك" : step === 2 ? "أنشئ حسابك" : "اختر خطتك"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {step === 1 ? "سيظهر هذا الاسم للزبائن في المنيو الرقمي" :
               step === 2 ? "ستستخدم هذه البيانات لتسجيل الدخول لاحقاً" :
               "يمكنك الترقية أو التخفيض في أي وقت"}
            </p>
          </div>

          <div className="p-6">
            {/* STEP 1 */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-primary" /> اسم المطعم / الكافيه *
                  </label>
                  <input
                    value={form.restaurantName}
                    onChange={e => update("restaurantName", e.target.value)}
                    placeholder="مثال: مطعم النخبة"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" /> اسم المالك *
                  </label>
                  <input
                    value={form.ownerName}
                    onChange={e => update("ownerName", e.target.value)}
                    placeholder="مثال: أحمد الزهراني"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <div className="bg-accent/50 border border-primary/20 rounded-2xl p-4 mt-2">
                  <p className="text-xs font-semibold text-primary mb-2">✨ ما الذي ستحصل عليه؟</p>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {["منيو رقمي احترافي جاهز في دقائق", "كود QR خاص بمطعمك وطاولاتك", "استقبال طلبات مباشرة من الزبائن"].map(f => (
                      <li key={f} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" /> البريد الإلكتروني *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => update("email", e.target.value)}
                    placeholder="example@restaurant.sa"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" /> كلمة المرور *
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={form.password}
                      onChange={e => update("password", e.target.value)}
                      placeholder="8 أحرف على الأقل"
                      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pl-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password strength */}
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                            form.password.length >= 4 + i * 2
                              ? i < 2 ? "bg-yellow-400" : i < 3 ? "bg-primary" : "bg-green-500"
                              : "bg-muted"
                          }`} />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {form.password.length < 6 ? "ضعيفة" : form.password.length < 8 ? "متوسطة" : form.password.length < 10 ? "جيدة" : "قوية جداً"}
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-muted/50 rounded-xl p-3 text-xs text-muted-foreground flex items-start gap-2">
                  <span className="text-base mt-0.5">🔒</span>
                  <span>بياناتك محمية بتشفير كامل. لن نشارك معلوماتك مع أي طرف ثالث.</span>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="space-y-3">
                {plans.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => update("plan", plan.id)}
                    className={`w-full text-right p-5 rounded-2xl border-2 transition-all flex items-start gap-4 ${
                      form.plan === plan.id
                        ? "border-primary bg-accent/60 shadow-sm"
                        : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${form.plan === plan.id ? "bg-primary/20" : "bg-muted"}`}>
                      {plan.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-black text-foreground">{plan.name}</span>
                        {plan.badge && (
                          <span className="text-xs bg-primary text-white font-bold px-2 py-0.5 rounded-full">{plan.badge}</span>
                        )}
                        <span className="mr-auto font-black text-primary text-lg">
                          {plan.price === "0" ? "مجاناً" : `${plan.price} ر.س/شهر`}
                        </span>
                      </div>
                      <ul className="flex flex-wrap gap-x-4 gap-y-1">
                        {plan.features.map(f => (
                          <li key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                            <Check className="w-3 h-3 text-primary shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center transition-all ${form.plan === plan.id ? "border-primary bg-primary" : "border-border"}`}>
                      {form.plan === plan.id && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                ))}

                <div className="bg-accent/50 border border-primary/20 rounded-2xl p-4 mt-2 flex items-start gap-3">
                  <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-foreground mb-0.5">تجربة مجانية 14 يوم</p>
                    <p className="text-xs text-muted-foreground">جرّب الخطة الاحترافية مجاناً 14 يوماً. لا يلزم بطاقة ائتمان.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 bg-destructive/10 border border-destructive/20 text-destructive text-sm px-4 py-3 rounded-xl mt-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button
                  onClick={() => { setStep((step - 1) as Step); setError(""); }}
                  className="flex items-center gap-1.5 border border-border text-foreground font-semibold px-4 py-3 rounded-xl hover:bg-accent/50 transition-all text-sm"
                >
                  <ChevronRight className="w-4 h-4" /> السابق
                </button>
              )}
              <button
                onClick={step === 3 ? handleSubmit : handleNext}
                disabled={loading}
                className="flex-1 bg-primary text-white font-bold py-3 rounded-xl hover:brightness-110 disabled:opacity-70 transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ إنشاء الحساب...</>
                  : step === 3
                  ? <><Check className="w-4 h-4" /> إنشاء الحساب</>
                  : <>التالي <ChevronLeft className="w-4 h-4" /></>
                }
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          لديك حساب مسبقاً؟{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">سجّل دخولك</Link>
        </p>
      </div>
    </div>
  );
}
