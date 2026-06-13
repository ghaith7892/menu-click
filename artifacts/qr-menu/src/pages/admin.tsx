import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, Store, CreditCard, QrCode, Settings, LogOut,
  Search, CheckCircle2, XCircle, Eye, Trash2, Users, TrendingUp,
  X, Pencil, Download, Copy, ChevronDown, Loader2, Menu, Bell,
  RefreshCw, Shield, BarChart3, ArrowUpRight, ArrowDownRight,
  Check, AlertTriangle,
} from "lucide-react";
import {
  getAllRestaurants, getAllUsers, updateRestaurant,
  updateRestaurantPlan, updateRestaurantActive, deleteRestaurant,
} from "@/lib/api";
import type { RestaurantRow, UserRow } from "@/lib/database.types";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { QRCodeCanvas } from "qrcode.react";

type Tab = "overview" | "restaurants" | "qrcodes" | "subscriptions" | "users" | "settings";

const PLAN_META: Record<RestaurantRow["plan"], { label: string; color: string; price: number; icon: string }> = {
  free:       { label: "مجاني",    color: "bg-gray-100 text-gray-600 border-gray-200",        price: 0,   icon: "🎁" },
  pro:        { label: "احترافي",  color: "bg-indigo-50 text-indigo-700 border-indigo-200",   price: 49,  icon: "⭐" },
  enterprise: { label: "مؤسسي",   color: "bg-purple-50 text-purple-700 border-purple-200",   price: 149, icon: "🏢" },
};

const primaryStyle = { background: "linear-gradient(135deg, #7c3aed, #6366f1)" };

// ─── Stat Card ────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, trend, trendUp }: {
  label: string; value: string | number; sub: string; icon: React.ReactNode;
  trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={primaryStyle}>
          {icon}
        </div>
        {trend && (
          <span className={`flex items-center gap-0.5 text-xs font-bold ${trendUp ? "text-green-600" : "text-red-500"}`}>
            {trendUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
      <p className="text-xs text-indigo-600 font-semibold mt-1">{sub}</p>
    </div>
  );
}

// ─── Edit Restaurant Modal ────────────────────────────────────
function EditModal({ restaurant, onClose, onSave }: {
  restaurant: RestaurantRow;
  onClose: () => void;
  onSave: (updated: RestaurantRow) => void;
}) {
  const [name, setName] = useState(restaurant.name);
  const [plan, setPlan] = useState<RestaurantRow["plan"]>(restaurant.plan);
  const [tables, setTables] = useState(String(restaurant.tables_count));
  const [isActive, setIsActive] = useState(restaurant.is_active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) { setError("الاسم مطلوب"); return; }
    setSaving(true); setError("");
    const { data, error: err } = await updateRestaurant(restaurant.id, {
      name: name.trim(),
      plan,
      tables_count: parseInt(tables) || 5,
      is_active: isActive,
    });
    setSaving(false);
    if (err || !data) { setError("حدث خطأ أثناء الحفظ"); return; }
    onSave(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">تعديل المطعم</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1.5">اسم المطعم</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1.5">الباقة</label>
            <div className="grid grid-cols-3 gap-2">
              {(["free", "pro", "enterprise"] as RestaurantRow["plan"][]).map(p => (
                <button key={p} onClick={() => setPlan(p)}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${plan === p ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  {PLAN_META[p].icon} {PLAN_META[p].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 block mb-1.5">عدد الطاولات</label>
            <input type="number" value={tables} onChange={e => setTables(e.target.value)}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">حالة المطعم</p>
              <p className="text-xs text-gray-400">{isActive ? "نشط ومرئي للعملاء" : "موقوف مؤقتاً"}</p>
            </div>
            <button onClick={() => setIsActive(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${isActive ? "bg-indigo-500" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${isActive ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
          {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm">إلغاء</button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-3 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2"
              style={primaryStyle}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              حفظ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm Delete Modal ─────────────────────────────────────
function ConfirmDelete({ name, onConfirm, onCancel }: {
  name: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 text-center" onClick={e => e.stopPropagation()}>
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <h3 className="font-black text-gray-900 text-lg mb-2">حذف المطعم</h3>
        <p className="text-sm text-gray-500 mb-5">هل أنت متأكد من حذف <span className="font-bold text-gray-900">{name}</span>؟ هذا الإجراء لا يمكن التراجع عنه.</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm">إلغاء</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold text-sm">تأكيد الحذف</button>
        </div>
      </div>
    </div>
  );
}

// ─── QR Modal ────────────────────────────────────────────────
function QRModal({ restaurant, onClose }: { restaurant: RestaurantRow; onClose: () => void }) {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const menuUrl = `${window.location.origin}${base}/menu/${restaurant.id}`;
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(menuUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQr = () => {
    const canvas = document.getElementById(`qr-modal-canvas`) as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${restaurant.name}-qr.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">QR Code — {restaurant.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-md border border-gray-100">
            <QRCodeCanvas id="qr-modal-canvas" value={menuUrl} size={180} includeMargin={false} />
            <p className="text-center text-sm font-bold text-gray-900 mt-3">{restaurant.name}</p>
          </div>
          <div className="w-full bg-gray-50 rounded-xl px-3 py-2.5 text-xs text-gray-500 truncate" dir="ltr">{menuUrl}</div>
          <div className="flex gap-3 w-full">
            <button onClick={copyUrl} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "تم النسخ!" : "نسخ الرابط"}
            </button>
            <button onClick={downloadQr} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm" style={primaryStyle}>
              <Download className="w-4 h-4" /> تحميل
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────
export default function AdminPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<RestaurantRow["plan"] | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRest, setEditingRest] = useState<RestaurantRow | null>(null);
  const [deletingRest, setDeletingRest] = useState<RestaurantRow | null>(null);
  const [qrRest, setQrRest] = useState<RestaurantRow | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [rests, usrs] = await Promise.all([getAllRestaurants(), getAllUsers()]);
      setRestaurants(rests);
      setUsers(usrs);
      setLoading(false);
    })();
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleToggleActive = async (rest: RestaurantRow) => {
    const newVal = !rest.is_active;
    setRestaurants(prev => prev.map(r => r.id === rest.id ? { ...r, is_active: newVal } : r));
    const { error } = await updateRestaurantActive(rest.id, newVal);
    if (error) {
      setRestaurants(prev => prev.map(r => r.id === rest.id ? { ...r, is_active: rest.is_active } : r));
      showToast("حدث خطأ أثناء التحديث");
    } else {
      showToast(newVal ? "تم تفعيل المطعم" : "تم إيقاف المطعم");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRest) return;
    await deleteRestaurant(deletingRest.id);
    setRestaurants(prev => prev.filter(r => r.id !== deletingRest.id));
    setDeletingRest(null);
    showToast("تم حذف المطعم بنجاح");
  };

  const handleChangePlan = async (rest: RestaurantRow, plan: RestaurantRow["plan"]) => {
    const { data, error } = await updateRestaurantPlan(rest.id, plan);
    if (!error && data) {
      setRestaurants(prev => prev.map(r => r.id === rest.id ? { ...r, plan } : r));
      showToast(`تم تغيير الباقة إلى ${PLAN_META[plan].label}`);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  // ─── Stats ─────────────────────────────────────────────────
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const stats = {
    total: restaurants.length,
    active: restaurants.filter(r => r.is_active).length,
    inactive: restaurants.filter(r => !r.is_active).length,
    newThisMonth: restaurants.filter(r => new Date(r.created_at) >= thisMonthStart).length,
    revenue: restaurants.reduce((s, r) => s + PLAN_META[r.plan].price, 0),
    pro: restaurants.filter(r => r.plan === "pro").length,
    enterprise: restaurants.filter(r => r.plan === "enterprise").length,
    free: restaurants.filter(r => r.plan === "free").length,
  };

  // ─── Filtered Restaurants ──────────────────────────────────
  const filtered = restaurants.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === "all" || r.plan === planFilter;
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? r.is_active : !r.is_active);
    return matchSearch && matchPlan && matchStatus;
  });

  // ─── Nav Items ─────────────────────────────────────────────
  const navItems: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview",       label: "نظرة عامة",    icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "restaurants",    label: "المطاعم",       icon: <Store className="w-5 h-5" /> },
    { id: "qrcodes",        label: "QR Codes",      icon: <QrCode className="w-5 h-5" /> },
    { id: "subscriptions",  label: "الاشتراكات",    icon: <CreditCard className="w-5 h-5" /> },
    { id: "users",          label: "المستخدمون",    icon: <Users className="w-5 h-5" /> },
    { id: "settings",       label: "الإعدادات",     icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans" dir="rtl">

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-green-400" /> {toast}
        </div>
      )}

      {/* ── Modals ── */}
      {editingRest && (
        <EditModal
          restaurant={editingRest}
          onClose={() => setEditingRest(null)}
          onSave={updated => {
            setRestaurants(prev => prev.map(r => r.id === updated.id ? updated : r));
            showToast("تم حفظ التعديلات");
          }}
        />
      )}
      {deletingRest && (
        <ConfirmDelete name={deletingRest.name} onConfirm={handleDeleteConfirm} onCancel={() => setDeletingRest(null)} />
      )}
      {qrRest && <QRModal restaurant={qrRest} onClose={() => setQrRest(null)} />}

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed lg:static inset-y-0 right-0 z-40 w-64 bg-white border-l border-gray-100 flex flex-col shadow-xl lg:shadow-none transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={primaryStyle}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-black text-sm text-gray-900">MenuClick Admin</p>
              <p className="text-xs text-gray-400">لوحة الإدارة الرئيسية</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === item.id
                  ? "text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
              style={activeTab === item.id ? primaryStyle : {}}>
              {item.icon}
              <span className="flex-1 text-right">{item.label}</span>
              {item.id === "restaurants" && (
                <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${activeTab === item.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
                  {stats.total}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100 space-y-2">
          <div className="bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-xs text-gray-500">مسجّل دخول كـ</p>
            <p className="text-xs font-bold text-gray-900 truncate">{user?.email ?? "admin"}</p>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut className="w-4 h-4" /> خروج
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Header ── */}
        <header className="bg-white border-b border-gray-100 px-4 lg:px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-black text-base text-gray-900">{navItems.find(n => n.id === activeTab)?.label}</h1>
              <p className="text-xs text-gray-400 hidden sm:block">مرحباً، {user?.name ?? "Admin"} 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-full">
              <Shield className="w-3.5 h-3.5" /> Super Admin
            </span>
            <button onClick={() => { setLoading(true); getAllRestaurants().then(r => { setRestaurants(r); setLoading(false); }); }}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">جارٍ تحميل البيانات...</p>
              </div>
            </div>
          ) : (

          <>
          {/* ════════════ OVERVIEW ════════════ */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <StatCard label="إجمالي المطاعم"    value={stats.total}      sub={`${stats.active} نشط`}             icon={<Store className="w-5 h-5" />}      trend={`${stats.newThisMonth} هذا الشهر`} trendUp={stats.newThisMonth > 0} />
                <StatCard label="الإيرادات الشهرية" value={`${stats.revenue} ر.س`} sub="من الاشتراكات"           icon={<TrendingUp className="w-5 h-5" />}  trend={`${stats.pro + stats.enterprise} مدفوع`} trendUp={true} />
                <StatCard label="اشتراكات مدفوعة"   value={stats.pro + stats.enterprise} sub={`${stats.pro} احترافي + ${stats.enterprise} مؤسسي`} icon={<CreditCard className="w-5 h-5" />} />
                <StatCard label="مطاعم موقوفة"       value={stats.inactive}   sub="تحتاج مراجعة"                      icon={<XCircle className="w-5 h-5" />}    trend={stats.inactive > 0 ? `${stats.inactive} موقوف` : "الكل نشط"} trendUp={stats.inactive === 0} />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Plan distribution */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-indigo-600" /> توزيع الاشتراكات
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "مجاني",   count: stats.free,       color: "bg-gray-400",    pct: stats.total ? (stats.free / stats.total) * 100 : 0 },
                      { label: "احترافي", count: stats.pro,        color: "bg-indigo-500",  pct: stats.total ? (stats.pro / stats.total) * 100 : 0 },
                      { label: "مؤسسي",  count: stats.enterprise, color: "bg-purple-500",  pct: stats.total ? (stats.enterprise / stats.total) * 100 : 0 },
                    ].map(p => (
                      <div key={p.label} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-gray-600 w-14 text-right shrink-0">{p.label}</span>
                        <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${p.color} rounded-full transition-all`} style={{ width: `${p.pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-900 w-5 text-center shrink-0">{p.count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xl font-black text-gray-900">{stats.free}</p>
                      <p className="text-xs text-gray-400">مجاني</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-indigo-600">{stats.pro}</p>
                      <p className="text-xs text-gray-400">احترافي</p>
                    </div>
                    <div>
                      <p className="text-xl font-black text-purple-600">{stats.enterprise}</p>
                      <p className="text-xs text-gray-400">مؤسسي</p>
                    </div>
                  </div>
                </div>

                {/* Recent restaurants */}
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Store className="w-4 h-4 text-indigo-600" /> آخر المطاعم المسجلة
                  </h3>
                  {restaurants.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">لا توجد مطاعم بعد</p>
                  ) : (
                    <div className="space-y-3">
                      {restaurants.slice(0, 5).map(r => (
                        <div key={r.id} className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 bg-indigo-50">
                            {r.logo ?? "🍽️"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                            <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("ar-SA")}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${PLAN_META[r.plan].color}`}>
                              {PLAN_META[r.plan].label}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${r.is_active ? "bg-green-500" : "bg-red-400"}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => setActiveTab("restaurants")}
                    className="mt-4 w-full text-center text-xs font-bold text-indigo-600 hover:underline">
                    عرض الكل ({stats.total}) →
                  </button>
                </div>
              </div>

              {/* Revenue bar chart */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-600" /> الإيرادات الشهرية (تقديري)
                  </h3>
                  <span className="text-sm font-black text-indigo-600">{stats.revenue} ر.س/شهر</span>
                </div>
                <div className="flex items-end gap-1.5 h-24">
                  {[30,45,38,60,55,70,65,80,75,90,85,stats.revenue > 0 ? Math.min(100, (stats.revenue / 500) * 100) : 10].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-lg transition-all hover:brightness-110 cursor-pointer"
                      style={{ height: `${h}%`, background: i === 11 ? "linear-gradient(135deg,#7c3aed,#6366f1)" : "#e0e7ff" }} />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5 text-[9px] text-gray-400 px-0.5">
                  {["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"].map(m => (
                    <span key={m} className="flex-1 text-center">{m.slice(0,3)}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════════════ RESTAURANTS ════════════ */}
          {activeTab === "restaurants" && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 bg-white border border-gray-100 rounded-xl flex items-center gap-2 px-3 py-2.5 shadow-sm">
                  <Search className="w-4 h-4 text-gray-400 shrink-0" />
                  <input className="flex-1 text-sm bg-transparent focus:outline-none" placeholder="ابحث بالاسم..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select value={planFilter} onChange={e => setPlanFilter(e.target.value as typeof planFilter)}
                  className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none shadow-sm text-gray-700">
                  <option value="all">كل الباقات</option>
                  <option value="free">مجاني</option>
                  <option value="pro">احترافي</option>
                  <option value="enterprise">مؤسسي</option>
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none shadow-sm text-gray-700">
                  <option value="all">كل الحالات</option>
                  <option value="active">نشط</option>
                  <option value="inactive">موقوف</option>
                </select>
                <span className="flex items-center text-xs text-gray-400 font-semibold px-1 shrink-0">{filtered.length} مطعم</span>
              </div>

              {/* Table */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">المطعم</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">تاريخ التسجيل</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">الباقة</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">الطاولات</th>
                        <th className="text-right px-4 py-3 text-xs font-bold text-gray-500">الحالة</th>
                        <th className="px-4 py-3 w-28" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filtered.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 bg-indigo-50">
                                {r.logo ?? "🍽️"}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{r.name}</p>
                                <p className="text-xs text-gray-400 truncate max-w-[140px]">{r.owner_id.slice(0, 16)}…</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString("ar-SA")}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${PLAN_META[r.plan].color}`}>
                              {PLAN_META[r.plan].icon} {PLAN_META[r.plan].label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{r.tables_count}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => handleToggleActive(r)}
                              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border transition-all ${
                                r.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"
                              }`}>
                              {r.is_active ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                              {r.is_active ? "نشط" : "موقوف"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 justify-end">
                              <button onClick={() => setQrRest(r)}
                                className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 hover:bg-indigo-100 transition-colors" title="QR Code">
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setEditingRest(r)}
                                className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors" title="تعديل">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <Link href={`/menu/${r.id}`}>
                                <button className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors" title="معاينة">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </Link>
                              <button onClick={() => setDeletingRest(r)}
                                className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors" title="حذف">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr><td colSpan={6} className="text-center py-10 text-sm text-gray-400">لا توجد نتائج</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-gray-50">
                  {filtered.map(r => (
                    <div key={r.id} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-indigo-50">{r.logo ?? "🍽️"}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">{r.name}</p>
                          <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString("ar-SA")}</p>
                        </div>
                        <button onClick={() => handleToggleActive(r)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-full border ${r.is_active ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
                          {r.is_active ? "نشط" : "موقوف"}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex-1 text-center ${PLAN_META[r.plan].color}`}>{PLAN_META[r.plan].icon} {PLAN_META[r.plan].label}</span>
                        <button onClick={() => setQrRest(r)} className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><QrCode className="w-4 h-4" /></button>
                        <button onClick={() => setEditingRest(r)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => setDeletingRest(r)} className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                  {filtered.length === 0 && <p className="text-center py-10 text-sm text-gray-400">لا توجد نتائج</p>}
                </div>
              </div>
            </div>
          )}

          {/* ════════════ QR CODES ════════════ */}
          {activeTab === "qrcodes" && (
            <div className="space-y-4">
              <div className="bg-white border border-gray-100 rounded-xl flex items-center gap-2 px-3 py-2.5 shadow-sm">
                <Search className="w-4 h-4 text-gray-400 shrink-0" />
                <input className="flex-1 text-sm bg-transparent focus:outline-none" placeholder="ابحث بالاسم..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {restaurants.length === 0 ? (
                <div className="text-center py-16 text-gray-400">لا توجد مطاعم</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {restaurants.filter(r => r.name.toLowerCase().includes(search.toLowerCase())).map(r => {
                    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
                    const menuUrl = `${window.location.origin}${base}/menu/${r.id}`;
                    return (
                      <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 w-full">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-base shrink-0">{r.logo ?? "🍽️"}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate text-sm">{r.name}</p>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${PLAN_META[r.plan].color}`}>{PLAN_META[r.plan].label}</span>
                          </div>
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${r.is_active ? "bg-green-500" : "bg-red-400"}`} />
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <QRCodeCanvas value={menuUrl} size={120} includeMargin={false} />
                        </div>
                        <p className="text-[10px] text-gray-400 truncate w-full text-center" dir="ltr">{menuUrl}</p>
                        <div className="flex gap-2 w-full">
                          <button onClick={() => navigator.clipboard.writeText(menuUrl).then(() => showToast("تم نسخ الرابط"))}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition-colors">
                            <Copy className="w-3.5 h-3.5" /> نسخ
                          </button>
                          <button onClick={() => setQrRest(r)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white font-bold text-xs" style={primaryStyle}>
                            <Download className="w-3.5 h-3.5" /> تحميل
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════ SUBSCRIPTIONS ════════════ */}
          {activeTab === "subscriptions" && (
            <div className="space-y-5">
              {/* Plan summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {(["free", "pro", "enterprise"] as RestaurantRow["plan"][]).map(p => {
                  const count = restaurants.filter(r => r.plan === p).length;
                  return (
                    <div key={p} className={`bg-white border-2 rounded-2xl p-5 shadow-sm ${p === "pro" ? "border-indigo-400" : p === "enterprise" ? "border-purple-400" : "border-gray-200"}`}>
                      <div className="text-3xl mb-3">{PLAN_META[p].icon}</div>
                      <p className="font-black text-lg text-gray-900 mb-1">{PLAN_META[p].label}</p>
                      <p className="text-3xl font-black text-indigo-600">{count}</p>
                      <p className="text-xs text-gray-400 mb-3">مشترك</p>
                      <div className="border-t border-gray-100 pt-3">
                        <p className="text-xs text-gray-500">السعر</p>
                        <p className="font-black text-gray-900">{PLAN_META[p].price > 0 ? `${PLAN_META[p].price} ر.س/شهر` : "مجاني"}</p>
                      </div>
                      <div className="border-t border-gray-100 pt-3 mt-3">
                        <p className="text-xs text-gray-500">الإيراد الشهري</p>
                        <p className="font-black text-indigo-600">{count * PLAN_META[p].price} ر.س</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subscription list */}
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">اشتراكات المطاعم</h3>
                  <span className="text-xs text-gray-400">{restaurants.length} مطعم</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {restaurants.map(r => (
                    <div key={r.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl shrink-0">{r.logo ?? "🍽️"}</div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{r.name}</p>
                          <p className="text-xs text-gray-400">منذ {new Date(r.created_at).toLocaleDateString("ar-SA")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${PLAN_META[r.plan].color}`}>
                          {PLAN_META[r.plan].icon} {PLAN_META[r.plan].label} — {PLAN_META[r.plan].price > 0 ? `${PLAN_META[r.plan].price} ر.س` : "مجاني"}
                        </span>
                        <div className="flex gap-1">
                          {(["free", "pro", "enterprise"] as RestaurantRow["plan"][]).filter(p => p !== r.plan).map(p => (
                            <button key={p} onClick={() => handleChangePlan(r, p)}
                              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors">
                              → {PLAN_META[p].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {restaurants.length === 0 && (
                    <p className="text-center py-10 text-sm text-gray-400">لا توجد مطاعم</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════════════ USERS ════════════ */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-2xl font-black text-gray-900">{users.length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">إجمالي المستخدمين</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-2xl font-black text-indigo-600">{users.filter(u => u.role === "restaurant").length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">أصحاب مطاعم</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-2xl font-black text-red-500">{users.filter(u => u.role === "admin").length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">مدراء النظام</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
                  <p className="text-2xl font-black text-green-600">{users.filter(u => new Date(u.created_at) >= thisMonthStart).length}</p>
                  <p className="text-xs text-gray-500 mt-0.5">جدد هذا الشهر</p>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">قائمة المستخدمين</h3>
                </div>
                {users.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-400">
                    لا يمكن عرض المستخدمين — تحقق من سياسات RLS لقاعدة البيانات
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {users.map(u => (
                      <div key={u.id} className="px-5 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                          style={{ background: u.role === "admin" ? "#ef4444" : "linear-gradient(135deg,#7c3aed,#6366f1)" }}>
                          {u.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">{u.name}</p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                            u.role === "admin"
                              ? "bg-red-50 text-red-600 border-red-200"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200"
                          }`}>
                            {u.role === "admin" ? "🛡️ أدمن" : "🍽️ صاحب مطعم"}
                          </span>
                          <p className="text-xs text-gray-400 hidden sm:block">{new Date(u.created_at).toLocaleDateString("ar-SA")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════════════ SETTINGS ════════════ */}
          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-5">
              {[
                {
                  title: "إعدادات المنصة",
                  icon: <Settings className="w-4 h-4 text-indigo-600" />,
                  fields: [
                    { label: "اسم المنصة", value: "MenuClick", type: "text" },
                    { label: "البريد الإلكتروني للدعم", value: "support@menuclick.app", type: "email" },
                    { label: "رقم الدعم الفني", value: "+966 5X XXX XXXX", type: "tel" },
                  ]
                },
                {
                  title: "أسعار الاشتراكات",
                  icon: <CreditCard className="w-4 h-4 text-indigo-600" />,
                  fields: [
                    { label: "سعر الباقة الاحترافية (ر.س/شهر)", value: "49", type: "number" },
                    { label: "سعر الباقة المؤسسية (ر.س/شهر)", value: "149", type: "number" },
                    { label: "فترة التجربة المجانية (يوم)", value: "14", type: "number" },
                  ]
                },
                {
                  title: "الحدود والقيود",
                  icon: <Shield className="w-4 h-4 text-indigo-600" />,
                  fields: [
                    { label: "حد الأصناف للباقة المجانية", value: "20", type: "number" },
                    { label: "حد الأصناف للباقة الاحترافية", value: "200", type: "number" },
                    { label: "حد الطاولات للباقة المجانية", value: "5", type: "number" },
                  ]
                }
              ].map(section => (
                <div key={section.title} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    {section.icon} {section.title}
                  </h3>
                  <div className="space-y-4">
                    {section.fields.map(f => (
                      <div key={f.label}>
                        <label className="text-xs font-bold text-gray-500 block mb-1.5">{f.label}</label>
                        <input type={f.type} defaultValue={f.value}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button className="flex items-center gap-2 text-white font-bold px-6 py-3 rounded-xl hover:brightness-110 transition-all shadow-sm" style={primaryStyle}>
                <Check className="w-4 h-4" /> حفظ الإعدادات
              </button>
            </div>
          )}
          </>
          )}
        </div>
      </main>
    </div>
  );
}
