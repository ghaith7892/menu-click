import { useState, useEffect } from "react";
import { Link } from "wouter";
import { QrCode, Check, Star, ChevronDown, Eye, Globe, QrCode as QrIcon } from "lucide-react";
import { useLang } from "@/context/lang-context";

/* ─── Phone Slide Illustrations ──────────────────────────── */

function SlideQR() {
  return (
    <div className="relative flex items-center justify-center" style={{ height: 320 }}>
      {/* Floating QR card behind */}
      <div className="absolute right-[52%] top-1/2 -translate-y-1/3 bg-white rounded-2xl p-3 shadow-xl z-10 rotate-6">
        <div className="w-14 h-14 grid grid-cols-3 gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`rounded-sm ${[0,1,3,4,5,7,8].includes(i) ? "bg-gray-900" : "bg-white"}`} />
          ))}
        </div>
      </div>

      {/* Main phone */}
      <div className="relative z-20" style={{ perspective: 800 }}>
        <div className="rounded-[40px] shadow-2xl" style={{
          background: "linear-gradient(145deg, #5b6ef0, #4855e8)",
          padding: "10px",
          width: 200,
          transform: "rotateY(-8deg) rotateX(4deg)",
        }}>
          {/* Notch */}
          <div className="w-12 h-4 bg-black/80 rounded-full mx-auto mb-2" />
          {/* Screen */}
          <div className="bg-gray-50 rounded-[30px] overflow-hidden" style={{ minHeight: 240, padding: "16px 12px" }}>
            <p className="text-center text-sm font-black text-gray-900 mb-3">Scan QR</p>
            {/* QR scanner UI */}
            <div className="rounded-2xl mx-auto flex items-center justify-center" style={{ background: "linear-gradient(135deg, #5b6ef0, #4855e8)", width: 120, height: 120 }}>
              <div className="bg-white rounded-xl p-2.5">
                {/* Simulated QR */}
                <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(7,1fr)", width: 56, height: 56 }}>
                  {[1,1,1,0,1,1,1, 1,0,1,0,1,0,1, 1,1,1,0,0,0,0, 0,0,0,1,0,1,0, 0,1,0,0,1,1,1, 1,0,1,0,1,0,1, 1,1,1,0,1,0,0].map((v, i) => (
                    <div key={i} className={`rounded-sm ${v ? "bg-gray-900" : "bg-white"}`} />
                  ))}
                </div>
              </div>
            </div>
            {/* Corner brackets */}
            <div className="flex justify-between mt-3 px-2">
              <div className="w-5 h-5 border-l-2 border-t-2 border-indigo-400 rounded-tl" />
              <div className="w-5 h-5 border-r-2 border-t-2 border-indigo-400 rounded-tr" />
            </div>
            <div className="flex justify-between px-2 -mt-1">
              <div className="w-5 h-5 border-l-2 border-b-2 border-indigo-400 rounded-bl" />
              <div className="w-5 h-5 border-r-2 border-b-2 border-indigo-400 rounded-br" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideMenu() {
  return (
    <div className="relative flex items-center justify-center" style={{ height: 320 }}>
      <div className="relative z-20" style={{ perspective: 800 }}>
        <div className="rounded-[40px] shadow-2xl" style={{
          background: "linear-gradient(145deg, #5b6ef0, #4855e8)",
          padding: "10px",
          width: 200,
          transform: "rotateY(-8deg) rotateX(4deg)",
        }}>
          <div className="w-12 h-4 bg-black/80 rounded-full mx-auto mb-2" />
          <div className="bg-gray-50 rounded-[30px] overflow-hidden px-3 py-4" style={{ minHeight: 250 }}>
            <p className="text-center text-sm font-black text-gray-900 mb-3">Menu</p>
            {/* Pizza item */}
            <div className="bg-white rounded-2xl mb-2 flex items-center justify-between px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl">🍕</div>
                <p className="text-xs font-bold text-gray-900">Pizza</p>
              </div>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #5b6ef0, #4855e8)" }}>+</div>
            </div>
            {/* Drink item */}
            <div className="bg-white rounded-2xl flex items-center justify-between px-3 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-xl">🥤</div>
                <p className="text-xs font-bold text-gray-900">Drink</p>
              </div>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: "linear-gradient(135deg, #5b6ef0, #4855e8)" }}>+</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SlidePreview() {
  const items = [
    { emoji: "🍟", name: "Snack box", price: "from 8 SR" },
    { emoji: "🥗", name: "Summer salad", price: "9 SR" },
    { emoji: "🧆", name: "Falafel salad", price: "11 SR" },
    { emoji: "🥙", name: "Doner salad", price: "from 12.5 SR" },
  ];
  return (
    <div className="flex flex-col items-center gap-4" style={{ height: 320 }}>
      {/* Phone */}
      <div className="rounded-[36px] shadow-2xl" style={{ background: "#1a1a2e", padding: "8px", width: 195 }}>
        <div className="w-10 h-3.5 bg-black rounded-full mx-auto mb-1.5" />
        <div className="bg-white rounded-[28px] overflow-hidden" style={{ minHeight: 220 }}>
          {/* Tabs */}
          <div className="flex gap-1.5 px-2 pt-2 pb-1 overflow-hidden">
            {["doners","snacks","sauces","drinks"].map((c,i)=>(
              <button key={c} className={`text-[8px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${i===1?"text-white":"text-gray-400"}`}
                style={i===1 ? { background: "linear-gradient(135deg,#7c3aed,#6366f1)" } : {}}>
                {c}
              </button>
            ))}
          </div>
          {/* Grid */}
          <div className="grid grid-cols-2 gap-1.5 px-2 pb-2">
            {items.map((item,i)=>(
              <div key={i} className="bg-gray-50 rounded-xl overflow-hidden">
                <div className="h-12 bg-gray-100 flex items-center justify-center text-2xl">{item.emoji}</div>
                <div className="p-1">
                  <p className="text-[8px] font-bold text-gray-900">{item.price}</p>
                  <p className="text-[7px] text-gray-500">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 text-center pb-1">
            <p className="text-[7px] text-gray-300">menuclick.app</p>
          </div>
        </div>
      </div>
      {/* Demo / AR buttons */}
      <div className="flex gap-2 w-full max-w-[220px]">
        <Link href="/menu/demo" className="flex-1">
          <button className="w-full bg-gray-900 text-white font-bold py-2.5 rounded-2xl text-xs hover:bg-gray-800 transition-colors">
            Demo menu
          </button>
        </Link>
        <Link href="/register" className="flex-1">
          <button className="w-full text-white font-bold py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1"
            style={{ background: "linear-gradient(135deg,#7c3aed,#6366f1)" }}>
            <span className="text-sm">✦</span> AR preview
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ─── Slide data ─────────────────────────────────────────── */
const SLIDES = [
  {
    title: "Create a free menu",
    illustration: <SlideQR />,
    ctaLabel: "Continue",
  },
  {
    title: "Create a free menu",
    illustration: <SlideMenu />,
    ctaLabel: "Continue",
  },
  {
    title: "It's free",
    illustration: <SlidePreview />,
    ctaLabel: "Create menu",
  },
];

/* ─── Carousel Hero ──────────────────────────────────────── */
function CarouselHero() {
  const [current, setCurrent] = useState(0);
  const { lang, setLang } = useLang();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % SLIDES.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];

  return (
    <section
      className="relative flex flex-col overflow-hidden"
      style={{
        minHeight: "100svh",
        background: "linear-gradient(160deg, #7c3aed 0%, #6366f1 50%, #4f46e5 100%)",
      }}
    >
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-6 pt-6 pb-2 z-10">
        <Link href="/login">
          <button className="text-white font-bold text-sm hover:text-white/80 transition-colors">
            Log in
          </button>
        </Link>
        <Link href="/register">
          <button className="text-white font-bold text-sm hover:text-white/80 transition-colors">
            Skip
          </button>
        </Link>
      </div>

      {/* ── Slides area ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4 relative">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 transition-all duration-500"
            style={{
              opacity: i === current ? 1 : 0,
              transform: i === current ? "translateX(0)" : i < current ? "translateX(8%)" : "translateX(-8%)",
              pointerEvents: i === current ? "auto" : "none",
            }}
          >
            {/* Title */}
            <h1 className="text-3xl font-black text-white text-center mb-6 leading-tight">
              {s.title}
            </h1>

            {/* Illustration */}
            <div className="w-full max-w-xs flex items-center justify-center">
              {s.illustration}
            </div>
          </div>
        ))}
      </div>

      {/* ── Pagination dots ── */}
      <div className="flex justify-center items-center gap-2 pb-5 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-400"
            style={{
              width: i === current ? 28 : 8,
              height: 6,
              background: i === current ? "white" : "rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </div>

      {/* ── Bottom Continue button ── */}
      <div className="px-6 pb-8 z-10">
        <Link href="/register">
          <button className="w-full bg-white text-gray-900 font-black py-4 rounded-3xl text-base shadow-xl hover:bg-gray-50 transition-colors">
            {slide.ctaLabel}
          </button>
        </Link>
      </div>
    </section>
  );
}

/* ─── Plans ──────────────────────────────────────────────── */
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

/* ─── Main Landing Page ──────────────────────────────────── */
export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    { q: "هل أحتاج لتطبيق لاستخدام المنيو؟", a: "لا، يفتح المنيو مباشرة في متصفح الهاتف فور مسح كود QR، دون الحاجة لتحميل أي تطبيق." },
    { q: "كم يستغرق إعداد المنيو؟", a: "يمكنك إنشاء منيو الأول في أقل من 10 دقائق، وطباعة أكواد QR والبدء فوراً." },
    { q: "هل يمكنني تعديل المنيو في أي وقت؟", a: "نعم، أي تعديل تجريه يظهر فوراً للزبائن دون الحاجة لإعادة طباعة QR." },
    { q: "هل بياناتي آمنة؟", a: "نعم، نستخدم أحدث معايير التشفير وحماية البيانات لضمان أمان معلوماتك ومعلومات زبائنك." },
  ];

  return (
    <div className="min-h-screen text-foreground font-sans" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap'); .font-sans { font-family: 'Cairo', sans-serif; }`}</style>

      {/* ===== CAROUSEL HERO ===== */}
      <CarouselHero />

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-3">كيف يعمل؟</h2>
          <p className="text-gray-500 mb-14 text-sm">ثلاث خطوات فقط وأنت جاهز</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "أنشئ منيو", desc: "أضف أقسامك وأصنافك وصورك وأسعارك من لوحة التحكم السهلة." },
              { step: "2", title: "ولّد QR Code", desc: "احصل على كود QR لمطعمك كاملاً أو لكل طاولة على حدة." },
              { step: "3", title: "ابدأ الآن", desc: "يمسح الزبون الكود ويرى المنيو مباشرة بدون تطبيق." },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-14 h-14 rounded-3xl text-white text-xl font-black flex items-center justify-center mb-5 shadow-lg"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 px-4" style={{ background: "#f8f7ff" }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 mb-14 text-center">ماذا يقول عملاؤنا؟</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-indigo-500 text-indigo-500" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">"{t.text}"</p>
                <div>
                  <p className="font-bold text-sm text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-gray-900 mb-3">خطط تناسب جميع الأحجام</h2>
            <p className="text-gray-500 text-sm">ابدأ مجاناً، وقم بالترقية عند الحاجة.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {plans.map((p, i) => (
              <div key={i} className={`rounded-3xl p-6 border flex flex-col ${p.highlight
                ? "text-white border-transparent shadow-xl"
                : "bg-white border-gray-100 shadow-sm"}`}
                style={p.highlight ? { background: "linear-gradient(135deg, #7c3aed, #6366f1)" } : {}}>
                {p.highlight && (
                  <div className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full self-start mb-4">الأكثر شعبية</div>
                )}
                <h3 className={`font-black text-xl mb-1 ${p.highlight ? "text-white" : "text-gray-900"}`}>{p.name}</h3>
                <div className={`text-3xl font-black mb-1 ${p.highlight ? "text-white" : "text-indigo-600"}`}>
                  {p.price === "0" ? "مجاني" : `${p.price} ر.س`}
                </div>
                <p className={`text-xs mb-6 ${p.highlight ? "text-white/70" : "text-gray-400"}`}>{p.period}</p>
                <ul className="flex flex-col gap-3 flex-1 mb-6">
                  {p.features.map((f, j) => (
                    <li key={j} className={`flex items-center gap-2 text-sm ${p.highlight ? "text-white" : "text-gray-700"}`}>
                      <Check className={`w-4 h-4 flex-shrink-0 ${p.highlight ? "text-white" : "text-indigo-500"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-2xl font-bold text-sm transition-all ${p.highlight
                  ? "bg-white text-indigo-600 hover:bg-gray-50"
                  : "text-white"}`}
                  style={!p.highlight ? { background: "linear-gradient(135deg, #7c3aed, #6366f1)" } : {}}>
                  {p.price === "0" ? "ابدأ مجاناً" : "اشترك الآن"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="py-20 px-4" style={{ background: "#f8f7ff" }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 mb-14 text-center">الأسئلة الشائعة</h2>
          <div className="flex flex-col gap-3">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <button
                  className="w-full text-right flex items-center justify-between px-5 py-4 font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span>{f.q}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 mr-2 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl font-black text-gray-900 mb-3">جاهز لتحديث مطعمك؟</h2>
          <p className="text-gray-500 text-sm mb-8">انضم إلى آلاف المطاعم التي تثق بمنيو كليك</p>
          <Link href="/register">
            <button className="w-full text-white font-bold py-4 rounded-2xl text-base shadow-xl hover:brightness-110 transition-all"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
              إنشاء حساب مجاناً
            </button>
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-100 py-8 px-4 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}>
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">MenuClick</span>
          </div>
          <p>© 2025 MenuClick. جميع الحقوق محفوظة.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-900 transition-colors">سياسة الخصوصية</a>
            <a href="#" className="hover:text-gray-900 transition-colors">الشروط والأحكام</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
