import { useState } from "react";
import { QrCode, LayoutDashboard, UtensilsCrossed, Smartphone, ChevronDown, Check, Star, ArrowLeft } from "lucide-react";

const features = [
  {
    icon: <QrCode className="w-6 h-6" />,
    title: "كود QR ذكي",
    desc: "ولّد أكواد QR خاصة بمطعمك أو بكل طاولة على حدة، بنقرة واحدة.",
  },
  {
    icon: <UtensilsCrossed className="w-6 h-6" />,
    title: "منيو رقمي كامل",
    desc: "أضف أقساماً ووجبات وصوراً وأسعاراً وخيارات إضافية بكل سهولة.",
  },
  {
    icon: <LayoutDashboard className="w-6 h-6" />,
    title: "لوحة تحكم متكاملة",
    desc: "استقبل الطلبات مباشرة من الطاولات وتابع حالتها لحظة بلحظة.",
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "تجربة زبون سلسة",
    desc: "واجهة سريعة ومتجاوبة مع الهاتف، تفتح فور مسح الـ QR دون تحميل أي تطبيق.",
  },
];

const plans = [
  {
    name: "مجاني",
    price: "0",
    period: "دائماً",
    highlight: false,
    features: ["منيو واحد", "حتى 20 صنف", "QR code واحد", "دعم أساسي"],
  },
  {
    name: "احترافي",
    price: "49",
    period: "شهرياً",
    highlight: true,
    features: ["منيو غير محدود", "أصناف غير محدودة", "QR لكل طاولة", "طلبات مباشرة", "إحصائيات وتقارير", "دعم أولوية"],
  },
  {
    name: "مؤسسي",
    price: "149",
    period: "شهرياً",
    highlight: false,
    features: ["كل مميزات الاحترافي", "عدة فروع", "تكامل أنظمة الكاشير", "دومين خاص", "مدير حساب مخصص"],
  },
];

const testimonials = [
  { name: "أحمد الزهراني", role: "صاحب مطعم السمك", stars: 5, text: "منذ تطبيق المنيو الرقمي، انخفض وقت الخدمة بنسبة 40% وزاد رضا الزبائن بشكل ملحوظ." },
  { name: "سارة القحطاني", role: "مديرة كافيه بريق", stars: 5, text: "الكود الرقمي جعل عملية الطلب أسرع وأدق، ولا مزيد من الأخطاء في الطلبات." },
  { name: "خالد العمري", role: "صاحب سلسلة مطاعم", stars: 5, text: "أتمكن من إدارة منيو جميع فروعي من مكان واحد. وفّر عليّ الكثير من الوقت والتكلفة." },
];

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "هل أحتاج لتطبيق لاستخدام المنيو؟", a: "لا، يفتح المنيو مباشرة في متصفح الهاتف فور مسح كود QR، دون الحاجة لتحميل أي تطبيق." },
    { q: "كم يستغرق إعداد المنيو؟", a: "يمكنك إنشاء منيوك الأول في أقل من 10 دقائق، وطباعة أكواد QR والبدء فوراً." },
    { q: "هل يمكنني تعديل المنيو في أي وقت؟", a: "نعم، أي تعديل تجريه يظهر فوراً للزبائن دون الحاجة لإعادة طباعة QR." },
    { q: "هل بياناتي آمنة؟", a: "نعم، نستخدم أحدث معايير التشفير وحماية البيانات لضمان أمان معلوماتك ومعلومات زبائنك." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      {/* Google Fonts - Cairo */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-foreground">منيو باركود</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">المميزات</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">الأسعار</a>
            <a href="#faq" className="hover:text-foreground transition-colors">الأسئلة الشائعة</a>
          </div>
          <div className="flex items-center gap-3">
            <button className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-3 py-2">
              تسجيل دخول
            </button>
            <button className="bg-primary hover:brightness-110 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all shadow-sm">
              ابدأ مجاناً
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/40 to-background pointer-events-none" />
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent text-primary text-xs font-semibold px-4 py-2 rounded-full mb-6 border border-primary/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            منصة SaaS للمطاعم والمقاهي
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-foreground leading-tight mb-6">
            منيوك الرقمي
            <br />
            <span className="text-primary">بمسح بسيط</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            حوّل قائمة طعامك إلى تجربة رقمية احترافية. أنشئ منيوك، ولّد كود QR لكل طاولة، واستقبل الطلبات مباشرة — كل ذلك في منصة واحدة.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="w-full sm:w-auto bg-primary hover:brightness-110 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
              ابدأ تجربتك المجانية
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button className="w-full sm:w-auto bg-card border border-border text-foreground font-semibold px-8 py-4 rounded-2xl text-base transition-all hover:border-primary/40 hover:bg-accent/50">
              شاهد كيف يعمل
            </button>
          </div>
          <p className="mt-5 text-sm text-muted-foreground">لا يلزم بطاقة ائتمان • إعداد في دقائق</p>
        </div>

        {/* Mock QR Preview */}
        <div className="relative mt-16 max-w-xs mx-auto">
          <div className="bg-card border border-border rounded-3xl shadow-xl p-6 text-center">
            <p className="text-xs text-muted-foreground mb-3 font-medium">مثال على الكود الخاص بك</p>
            <div className="w-36 h-36 mx-auto bg-foreground/5 rounded-2xl flex items-center justify-center border border-border">
              <QrCode className="w-20 h-20 text-primary" />
            </div>
            <p className="mt-3 text-sm font-bold text-foreground">مطعم النخبة — طاولة 5</p>
            <p className="text-xs text-muted-foreground mt-1">امسح لعرض المنيو والطلب</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">كل ما تحتاجه في مكان واحد</h2>
            <p className="text-muted-foreground text-base max-w-xl mx-auto">منصة متكاملة تُغني عن الحلول المتفرقة وتوفّر تجربة سلسة للمطعم والزبون معاً.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-all">
                  {f.icon}
                </div>
                <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">كيف يعمل؟</h2>
          <p className="text-muted-foreground mb-14">ثلاث خطوات فقط وأنت جاهز</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "أنشئ منيوك", desc: "أضف أقسامك وأصنافك وصورك وأسعارك من لوحة التحكم السهلة." },
              { step: "2", title: "ولّد QR Code", desc: "احصل على كود QR لمطعمك كاملاً أو لكل طاولة على حدة." },
              { step: "3", title: "استقبل الطلبات", desc: "يمسح الزبون الكود ويطلب مباشرة، وتصلك الطلبات فورياً." },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white text-xl font-black flex items-center justify-center mb-5 shadow-md">
                  {s.step}
                </div>
                <h3 className="font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-card/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">ماذا يقول عملاؤنا؟</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <p className="font-bold text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">خطط تناسب جميع الأحجام</h2>
            <p className="text-muted-foreground">ابدأ مجاناً، وقم بالترقية عند الحاجة.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <div key={i} className={`rounded-2xl p-6 border flex flex-col ${p.highlight ? "bg-primary text-white border-primary shadow-xl scale-105" : "bg-card border-border"}`}>
                {p.highlight && (
                  <div className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full self-start mb-4">الأكثر شعبية</div>
                )}
                <h3 className={`font-black text-xl mb-1 ${p.highlight ? "text-white" : "text-foreground"}`}>{p.name}</h3>
                <div className={`text-3xl font-black mb-1 ${p.highlight ? "text-white" : "text-primary"}`}>
                  {p.price === "0" ? "مجاني" : `${p.price} ر.س`}
                </div>
                <p className={`text-xs mb-6 ${p.highlight ? "text-white/70" : "text-muted-foreground"}`}>{p.period}</p>
                <ul className="flex flex-col gap-3 flex-1 mb-6">
                  {p.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-2 text-sm ${p.highlight ? "text-white" : "text-foreground"}`}>
                      <Check className={`w-4 h-4 flex-shrink-0 ${p.highlight ? "text-white" : "text-primary"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${p.highlight ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-white hover:brightness-110"}`}>
                  {p.price === "0" ? "ابدأ مجاناً" : "اشترك الآن"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4 bg-card/50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-foreground mb-4">الأسئلة الشائعة</h2>
          </div>
          <div className="flex flex-col gap-4">
            {faqs.map((f, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
                <button
                  className="w-full text-right flex items-center justify-between px-5 py-4 font-semibold text-foreground hover:bg-accent/50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{f.q}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center bg-primary rounded-3xl p-12 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 relative">جاهز لتحديث مطعمك؟</h2>
          <p className="text-white/80 mb-8 relative">انضم إلى آلاف المطاعم والمقاهي التي تثق بمنيو باركود</p>
          <button className="bg-white text-primary font-bold px-10 py-4 rounded-2xl text-base hover:bg-white/90 transition-all shadow-lg relative">
            ابدأ مجاناً الآن
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground">منيو باركود</span>
          </div>
          <p>© 2025 منيو باركود. جميع الحقوق محفوظة.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-foreground transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-foreground transition-colors">الشروط والأحكام</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
