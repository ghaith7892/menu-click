import { useState } from "react";
import {
  LayoutDashboard, Store, CreditCard, TrendingUp,
  QrCode, Settings, LogOut, Search,
  CheckCircle2, XCircle, Eye, Trash2
} from "lucide-react";
import { MOCK_ADMIN_RESTAURANTS, type Restaurant } from "@/data/mock";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";

type Tab = "overview" | "restaurants" | "plans" | "settings";

const PLAN_LABELS: Record<Restaurant["plan"], { label: string; color: string }> = {
  free:       { label: "مجاني",    color: "bg-gray-100 text-gray-600 border-gray-200" },
  pro:        { label: "احترافي",  color: "bg-primary/10 text-primary border-primary/20" },
  enterprise: { label: "مؤسسي",   color: "bg-purple-100 text-purple-700 border-purple-200" },
};

export default function AdminPage() {
  const { logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [restaurants, setRestaurants] = useState(MOCK_ADMIN_RESTAURANTS);

  const handleLogout = () => { logout(); navigate("/login"); };

  const filtered = restaurants.filter(r =>
    r.name.includes(search) || r.owner.includes(search)
  );

  const stats = {
    total: restaurants.length,
    active: restaurants.filter(r => r.isActive).length,
    pro: restaurants.filter(r => r.plan === "pro").length,
    enterprise: restaurants.filter(r => r.plan === "enterprise").length,
    revenue: restaurants.reduce((s, r) => s + (r.plan === "pro" ? 49 : r.plan === "enterprise" ? 149 : 0), 0),
  };

  const toggleActive = (id: string) => {
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  };

  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview",     label: "لوحة التحكم",  icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "restaurants",  label: "المطاعم",       icon: <Store className="w-5 h-5" /> },
    { id: "plans",        label: "الاشتراكات",    icon: <CreditCard className="w-5 h-5" /> },
    { id: "settings",     label: "الإعدادات",     icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-l border-border flex flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <QrCode className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-sm text-foreground">منيو باركود</p>
              <p className="text-xs text-muted-foreground">لوحة الإدارة</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === item.id
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              }`}
            >
              {item.icon}
              <span className="flex-1 text-right">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>خروج</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-bold text-lg text-foreground">{navItems.find(n => n.id === activeTab)?.label}</h1>
            <p className="text-xs text-muted-foreground">مرحباً بك في لوحة إدارة المنيو باركود</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-destructive/10 text-destructive px-3 py-1.5 rounded-full">المسؤول الرئيسي</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">

          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "إجمالي المطاعم",    value: stats.total,    icon: <Store className="w-5 h-5" />,    bg: "bg-blue-50",    color: "text-blue-600",   sub: `${stats.active} نشط` },
                  { label: "الاشتراكات الاحترافية", value: stats.pro, icon: <Users className="w-5 h-5" />,    bg: "bg-accent",     color: "text-primary",    sub: `${stats.enterprise} مؤسسي` },
                  { label: "الإيرادات الشهرية",  value: `${stats.revenue} ر.س`, icon: <TrendingUp className="w-5 h-5" />, bg: "bg-green-50", color: "text-green-600", sub: "هذا الشهر" },
                  { label: "المطاعم الموقوفة",   value: stats.total - stats.active, icon: <XCircle className="w-5 h-5" />, bg: "bg-red-50", color: "text-red-500", sub: "تحتاج مراجعة" },
                ].map((s, i) => (
                  <div key={i} className="bg-card border border-border rounded-2xl p-5">
                    <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                      {s.icon}
                    </div>
                    <p className="text-2xl font-black text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                    <p className="text-xs text-primary font-semibold mt-1">{s.sub}</p>
                  </div>
                ))}
              </div>

              {/* Plan distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-bold text-foreground mb-4">توزيع الاشتراكات</h3>
                  <div className="space-y-3">
                    {[
                      { label: "مجاني",    count: restaurants.filter(r => r.plan === "free").length,       color: "bg-gray-400",    pct: (restaurants.filter(r => r.plan === "free").length / stats.total) * 100 },
                      { label: "احترافي",  count: stats.pro,                                               color: "bg-primary",     pct: (stats.pro / stats.total) * 100 },
                      { label: "مؤسسي",   count: stats.enterprise,                                         color: "bg-purple-500",  pct: (stats.enterprise / stats.total) * 100 },
                    ].map(p => (
                      <div key={p.label} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-foreground w-16">{p.label}</span>
                        <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${p.color} rounded-full transition-all`} style={{ width: `${p.pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-foreground w-6 text-center">{p.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-bold text-foreground mb-4">آخر المطاعم المسجلة</h3>
                  <div className="space-y-3">
                    {restaurants.slice(0, 4).map(r => (
                      <div key={r.id} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: r.coverColor + "20" }}>
                          {r.logo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{r.name}</p>
                          <p className="text-xs text-muted-foreground">{r.owner}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PLAN_LABELS[r.plan].color}`}>
                          {PLAN_LABELS[r.plan].label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monthly revenue chart placeholder */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold text-foreground mb-4">الإيرادات الشهرية</h3>
                <div className="flex items-end gap-3 h-28">
                  {[40, 55, 48, 70, 62, 88, 75, 92, 80, 105, 98, 120].map((h, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full rounded-t-md bg-primary/20 hover:bg-primary/40 transition-colors cursor-pointer" style={{ height: `${h}%` }} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground px-0.5">
                  {["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"].map(m => (
                    <span key={m} className="flex-1 text-center">{m.slice(0,3)}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RESTAURANTS */}
          {activeTab === "restaurants" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-card border border-border rounded-xl flex items-center gap-2 px-3 py-2.5">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <input
                    className="flex-1 text-sm bg-transparent focus:outline-none"
                    placeholder="ابحث بالاسم أو المالك..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{filtered.length} مطعم</span>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground">المطعم</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground">المالك</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground">الخطة</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground">الطاولات</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground">الحالة</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map(r => (
                      <tr key={r.id} className="hover:bg-accent/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: r.coverColor + "20" }}>
                              {r.logo}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground text-sm">{r.name}</p>
                              <p className="text-xs text-muted-foreground">منذ {r.createdAt}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-foreground">{r.owner}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${PLAN_LABELS[r.plan].color}`}>
                            {PLAN_LABELS[r.plan].label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground">{r.tables}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(r.id)}
                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                              r.isActive
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-600 border-red-200"
                            }`}
                          >
                            {r.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            {r.isActive ? "نشط" : "موقوف"}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            <Link href="/dashboard">
                              <button className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </Link>
                            <button className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive/70 hover:text-destructive transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PLANS */}
          {activeTab === "plans" && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { name: "مجاني",    count: restaurants.filter(r => r.plan === "free").length,       rev: 0,   color: "border-border",   icon: "🎁" },
                  { name: "احترافي",  count: stats.pro,                                               rev: 49,  color: "border-primary",  icon: "⭐" },
                  { name: "مؤسسي",   count: stats.enterprise,                                         rev: 149, color: "border-purple-300", icon: "🏢" },
                ].map(p => (
                  <div key={p.name} className={`bg-card border-2 ${p.color} rounded-2xl p-5`}>
                    <div className="text-2xl mb-3">{p.icon}</div>
                    <p className="font-black text-foreground text-lg mb-1">{p.name}</p>
                    <p className="text-3xl font-black text-primary">{p.count}</p>
                    <p className="text-xs text-muted-foreground mb-3">مشترك</p>
                    <div className="border-t border-border pt-3">
                      <p className="text-sm text-muted-foreground">إيراد شهري</p>
                      <p className="font-black text-foreground">{p.count * p.rev} ر.س</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h3 className="font-bold text-foreground">تفاصيل الاشتراكات</h3>
                </div>
                <div className="divide-y divide-border">
                  {restaurants.map(r => (
                    <div key={r.id} className="px-5 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg" style={{ background: r.coverColor + "20" }}>
                          {r.logo}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{r.name}</p>
                          <p className="text-xs text-muted-foreground">تسجيل: {r.createdAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${PLAN_LABELS[r.plan].color}`}>
                          {PLAN_LABELS[r.plan].label}
                        </span>
                        <span className="font-black text-sm text-foreground">
                          {r.plan === "pro" ? "49" : r.plan === "enterprise" ? "149" : "0"} ر.س/شهر
                        </span>
                        <button className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                          ترقية
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-5">
              {[
                {
                  title: "إعدادات المنصة",
                  fields: [
                    { label: "اسم المنصة", value: "منيو باركود", type: "text" },
                    { label: "البريد الإلكتروني", value: "admin@qrmenu.sa", type: "email" },
                    { label: "رقم الدعم الفني", value: "+966 5X XXX XXXX", type: "tel" },
                  ]
                },
                {
                  title: "إعدادات الاشتراكات",
                  fields: [
                    { label: "سعر الخطة الاحترافية (ر.س/شهر)", value: "49", type: "number" },
                    { label: "سعر الخطة المؤسسية (ر.س/شهر)", value: "149", type: "number" },
                    { label: "فترة التجربة المجانية (يوم)", value: "14", type: "number" },
                  ]
                }
              ].map(section => (
                <div key={section.title} className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-bold text-foreground mb-4">{section.title}</h3>
                  <div className="space-y-4">
                    {section.fields.map(f => (
                      <div key={f.label}>
                        <label className="text-xs font-semibold text-foreground block mb-1.5">{f.label}</label>
                        <input
                          type={f.type}
                          defaultValue={f.value}
                          className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button className="bg-primary text-white font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all shadow-sm">
                حفظ التغييرات
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
