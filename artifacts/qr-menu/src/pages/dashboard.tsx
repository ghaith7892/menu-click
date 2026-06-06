import { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, UtensilsCrossed, QrCode, ShoppingBag,
  Trash2, Bell, LogOut,
  CheckCircle2, Clock, ChefHat, Truck, X, Settings,
  TrendingUp, Star, DollarSign, Table2, Eye, Loader2, Globe,
  Plus, Minus, Camera, Link2, Download, Pencil
} from "lucide-react";
import type { OrderStatus, CategoryRow, MenuItemRow, OrderRow, RestaurantRow } from "@/lib/database.types";
import {
  getRestaurantByOwner, getCategories, getMenuItems, getOrders,
  updateOrderStatus, deleteMenuItem, subscribeToOrders
} from "@/lib/api";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useLang, type Lang } from "@/context/lang-context";

type Tab = "overview" | "menu" | "qr" | "orders" | "settings";
type UnitType = "g" | "ml";

interface Variation {
  id: string;
  name: string;
  price: string;
  amount: string;
}

/* ─── Toggle Switch ───────────────────────────────── */
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${value ? "bg-indigo-500" : "bg-gray-200"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? "left-6" : "left-0.5"}`} />
    </button>
  );
}

/* ─── Item Modal (Menusa style) ───────────────────── */
function ItemModal({
  open, onClose, categories,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryRow[];
}) {
  const [selectedCat, setSelectedCat] = useState(categories[0]?.id ?? "");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<UnitType>("g");
  const [variations, setVariations] = useState<Variation[]>([
    { id: "1", name: "", price: "", amount: "" },
  ]);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [hideFromMenu, setHideFromMenu] = useState(false);
  const [outOfStock, setOutOfStock] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addVariation = () =>
    setVariations(v => [...v, { id: Date.now().toString(), name: "", price: "", amount: "" }]);

  const removeVariation = (id: string) =>
    setVariations(v => v.filter(x => x.id !== id));

  const updateVariation = (id: string, field: keyof Variation, val: string) =>
    setVariations(v => v.map(x => x.id === id ? { ...x, [field]: val } : x));

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPhoto(URL.createObjectURL(file));
  };

  if (!open) return null;

  const inputCls = "w-full bg-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl overflow-y-auto shadow-2xl"
        style={{ maxHeight: "92vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button className="text-indigo-400 text-sm font-semibold" onClick={onClose}>حفظ</button>
          <h3 className="font-bold text-gray-900 text-base">صنف</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">

          {/* Category selector */}
          <div className="flex items-center justify-between bg-gray-100 rounded-2xl px-4 py-3.5">
            <select
              value={selectedCat}
              onChange={e => setSelectedCat(e.target.value)}
              className="bg-transparent text-sm text-gray-900 font-medium flex-1 focus:outline-none appearance-none"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
            <span className="text-gray-400 text-sm">›</span>
          </div>

          {/* Name */}
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="الاسم"
            className={inputCls}
          />

          {/* Variations */}
          {variations.map((v, idx) => (
            <div key={v.id} className="space-y-2">
              <div className="flex gap-2 items-center">
                {/* Price */}
                <div className="flex-1">
                  {idx === 0 && <p className="text-[10px] text-gray-400 font-semibold mb-1 px-1">السعر، ر.س</p>}
                  <input
                    type="number"
                    value={v.price}
                    onChange={e => updateVariation(v.id, "price", e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                {/* Amount */}
                <div className="flex-1">
                  {idx === 0 && <p className="text-[10px] text-gray-400 font-semibold mb-1 px-1">الكمية، {unit === "g" ? "غرام" : "مل"}</p>}
                  <input
                    type="number"
                    value={v.amount}
                    onChange={e => updateVariation(v.id, "amount", e.target.value)}
                    placeholder="0"
                    className="w-full bg-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                {/* Unit toggle */}
                {idx === 0 ? (
                  <div className="mt-5">
                    <button
                      onClick={() => setUnit(u => u === "g" ? "ml" : "g")}
                      className="w-10 h-10 rounded-2xl bg-gray-900 text-white text-xs font-bold flex items-center justify-center flex-shrink-0"
                    >
                      {unit}
                    </button>
                  </div>
                ) : (
                  <div className="mt-0 flex items-center">
                    <button
                      onClick={() => removeVariation(v.id)}
                      className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {/* Variation name */}
              <input
                value={v.name}
                onChange={e => updateVariation(v.id, "name", e.target.value)}
                placeholder={idx === 0 ? "صغير" : "كبير"}
                className={inputCls}
              />
            </div>
          ))}

          {/* Add variation */}
          <button
            onClick={addVariation}
            className="w-full bg-gray-100 rounded-2xl py-3.5 text-sm font-semibold text-indigo-600 hover:bg-gray-200 transition-colors"
          >
            + إضافة حجم / خيار
          </button>

          {/* Description */}
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="وصف شهي جداً..."
            rows={3}
            className={inputCls + " resize-none"}
          />

          {/* Photo upload */}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          {photo ? (
            <div className="relative">
              <img src={photo} className="w-36 h-28 rounded-2xl object-cover" />
              <button
                onClick={() => setPhoto(null)}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-36 h-28 rounded-2xl flex flex-col items-center justify-center gap-1 text-indigo-600 font-semibold text-sm"
              style={{ border: "2px dashed #6366f1" }}
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs leading-tight text-center">أضف<br/>صورة</span>
            </button>
          )}

          {/* Toggles */}
          <div className="space-y-3">
            <div className="bg-gray-100 rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">إخفاء من المنيو</p>
                <p className="text-xs text-gray-400 mt-0.5">سيظهر الصنف لك فقط</p>
              </div>
              <Toggle value={hideFromMenu} onChange={setHideFromMenu} />
            </div>
            <div className="bg-gray-100 rounded-2xl px-4 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">غير متوفر</p>
                <p className="text-xs text-gray-400 mt-0.5">سيرى الضيوف أنه سيكون متاحاً لاحقاً</p>
              </div>
              <Toggle value={outOfStock} onChange={setOutOfStock} />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl text-white font-bold text-base mt-2 hover:brightness-110 transition-all"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
          >
            إضافة
          </button>
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main Dashboard ──────────────────────────────── */
export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { t, lang, setLang, dir } = useLang();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("menu");
  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedQrTable, setSelectedQrTable] = useState<number | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [pendingLang, setPendingLang] = useState<Lang>(lang);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => { setPendingLang(lang); }, [lang]);

  useEffect(() => {
    if (!user?.id) return;
    let unsubscribe: (() => void) | undefined;
    (async () => {
      setDataLoading(true);
      const rest = await getRestaurantByOwner(user.id);
      setRestaurant(rest);
      if (rest) {
        const [cats, items, ords] = await Promise.all([
          getCategories(rest.id),
          getMenuItems(rest.id),
          getOrders(rest.id),
        ]);
        setCategories(cats);
        setMenuItems(items);
        setOrders(ords);
        unsubscribe = subscribeToOrders(rest.id, setOrders);
      }
      setDataLoading(false);
    })();
    return () => unsubscribe?.();
  }, [user?.id]);

  const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode; next?: OrderStatus; nextLabel?: string }> = {
    pending:   { label: t.pending,         color: "bg-yellow-100 text-yellow-700 border-yellow-200",  icon: <Clock className="w-3.5 h-3.5" />,       next: "preparing", nextLabel: t.startPrep },
    preparing: { label: t.preparing,       color: "bg-blue-100 text-blue-700 border-blue-200",        icon: <ChefHat className="w-3.5 h-3.5" />,      next: "ready",     nextLabel: t.readyToDeliver },
    ready:     { label: t.ready,           color: "bg-green-100 text-green-700 border-green-200",      icon: <CheckCircle2 className="w-3.5 h-3.5" />, next: "delivered", nextLabel: t.delivered },
    delivered: { label: t.deliveredStatus, color: "bg-gray-100 text-gray-500 border-gray-200",         icon: <Truck className="w-3.5 h-3.5" /> },
  };

  const handleLogout = () => { logout(); navigate("/login"); };
  const pendingCount = orders.filter(o => o.status === "pending").length;

  const advanceOrder = async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const cfg = STATUS_CONFIG[order.status];
    if (!cfg.next) return;
    const { data } = await updateOrderStatus(id, cfg.next);
    if (data) setOrders(prev => prev.map(o => o.id === id ? data : o));
  };

  const handleDeleteItem = async (id: string) => {
    await deleteMenuItem(id);
    setMenuItems(prev => prev.filter(i => i.id !== id));
  };

  const filteredItems = selectedCategory === "all"
    ? menuItems
    : menuItems.filter(i => i.category_id === selectedCategory);

  const tablesCount = restaurant?.tables_count ?? 5;
  const planLabel = (plan?: string) =>
    plan === "pro" ? t.planPro : plan === "enterprise" ? t.planEnterprise : t.planFree;

  const handleSaveSettings = () => {
    setLang(pendingLang);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "overview",  label: t.overview,  icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "menu",      label: t.menuMgmt,  icon: <UtensilsCrossed className="w-5 h-5" /> },
    { id: "qr",        label: t.qrCodes,   icon: <QrCode className="w-5 h-5" /> },
    { id: "orders",    label: t.orders,    icon: <ShoppingBag className="w-5 h-5" />, badge: pendingCount },
  ];

  if (dataLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const primaryStyle = { background: "linear-gradient(135deg, #7c3aed, #6366f1)" };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans" dir={dir}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap'); .font-sans { font-family: 'Cairo', sans-serif; }`}</style>

      {/* ── Sidebar ── */}
      <aside className={`w-60 bg-white flex flex-col shrink-0 border-gray-100 ${dir === "rtl" ? "border-l" : "border-r"}`}
        style={{ borderWidth: 1 }}>
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-sm"
              style={primaryStyle}>
              <span className="text-white text-lg">{restaurant?.logo ?? "🍽️"}</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-gray-900 truncate">{restaurant?.name ?? user?.restaurantName ?? "—"}</p>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ ...primaryStyle, fontSize: 10 }}>
                {planLabel(restaurant?.plan ?? user?.plan)}
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                activeTab === item.id
                  ? "text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
              style={activeTab === item.id ? primaryStyle : {}}
            >
              {item.icon}
              <span className="flex-1 text-start">{item.label}</span>
              {item.badge ? (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                  activeTab === item.id ? "bg-white/30 text-white" : "bg-indigo-100 text-indigo-600"
                }`}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-100 space-y-1">
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              activeTab === "settings" ? "text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            }`}
            style={activeTab === "settings" ? primaryStyle : {}}
          >
            <Settings className="w-5 h-5" />
            <span className="flex-1 text-start">{t.settings}</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="flex-1 text-start">{t.logout}</span>
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-bold text-lg text-gray-900">
              {activeTab === "settings" ? t.settings : navItems.find(n => n.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-gray-400">{t.welcome}، {user?.name ?? "—"} 👋</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-9 h-9 rounded-2xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <Bell className="w-4 h-4 text-gray-400" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -left-1 w-4 h-4 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                    style={primaryStyle}>
                    {pendingCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className={`absolute ${dir === "rtl" ? "left-0" : "right-0"} top-11 w-64 bg-white border border-gray-100 rounded-3xl shadow-xl z-50 overflow-hidden`}>
                  <div className="p-3 border-b border-gray-100">
                    <p className="font-bold text-sm text-gray-900">{t.notifications}</p>
                  </div>
                  {orders.filter(o => o.status === "pending").map(o => (
                    <div key={o.id} className="p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">{t.newOrder} {o.table_number}</p>
                      <p className="text-xs text-gray-400">{(o.items as unknown[]).length} {t.items} • {o.total} {t.currency}</p>
                    </div>
                  ))}
                  {orders.filter(o => o.status === "pending").length === 0 && (
                    <p className="p-4 text-sm text-gray-400 text-center">لا إشعارات</p>
                  )}
                </div>
              )}
            </div>
            <Link href={restaurant ? `/menu/${restaurant.id}` : "#"}>
              <button className="flex items-center gap-2 text-sm font-semibold text-gray-600 border border-gray-200 px-3 py-2 rounded-2xl hover:bg-gray-50 transition-colors">
                <Eye className="w-4 h-4" />
                {t.previewMenu}
              </button>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">

          {/* ══ OVERVIEW TAB ══ */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: t.totalOrdersToday, value: "24",                 icon: <ShoppingBag className="w-5 h-5" />, color: "text-blue-600",   bg: "bg-blue-50" },
                  { label: t.revenueToday,      value: `1,840 ${t.currency}`, icon: <DollarSign className="w-5 h-5" />,  color: "text-green-600",  bg: "bg-green-50" },
                  { label: t.avgOrderValue,     value: `76 ${t.currency}`,    icon: <TrendingUp className="w-5 h-5" />,  color: "text-indigo-600", bg: "bg-indigo-50" },
                  { label: t.activeTables,      value: `${orders.filter(o => o.status !== "delivered").length}/${tablesCount}`, icon: <Table2 className="w-5 h-5" />, color: "text-purple-600", bg: "bg-purple-50" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
                    <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-3`}>
                      {stat.icon}
                    </div>
                    <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">{t.recentOrders}</h2>
                  <button onClick={() => setActiveTab("orders")} className="text-xs font-semibold text-indigo-600 hover:underline">{t.viewAll}</button>
                </div>
                <div className="divide-y divide-gray-100">
                  {orders.slice(0, 4).map(order => {
                    const cfg = STATUS_CONFIG[order.status];
                    return (
                      <div key={order.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-sm text-white"
                            style={primaryStyle}>
                            {order.table_number}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{t.table} {order.table_number}</p>
                            <p className="text-xs text-gray-400">{(order.items as unknown[]).length} {t.itemsCount} • {order.total} {t.currency}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                  {orders.length === 0 && <p className="p-6 text-center text-sm text-gray-400">—</p>}
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">{t.topItems}</h2>
                </div>
                <div className="p-4 space-y-3">
                  {menuItems.filter(i => i.is_popular).slice(0, 5).map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="text-lg w-8 text-center">{item.image ?? "🍽️"}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${85 - idx * 15}%`, ...primaryStyle }} />
                          </div>
                          <span className="text-xs text-gray-400">{85 - idx * 15}%</span>
                        </div>
                      </div>
                      <Star className="w-4 h-4 fill-indigo-500 text-indigo-500" />
                    </div>
                  ))}
                  {menuItems.filter(i => i.is_popular).length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-4">—</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ MENU TAB (Menusa style) ══ */}
          {activeTab === "menu" && (
            <div className="max-w-2xl space-y-0">

              {/* Cover photo */}
              <div className="relative h-44 rounded-3xl overflow-hidden mb-4 bg-gray-200 group cursor-pointer"
                style={{ background: restaurant?.cover_color ?? "linear-gradient(135deg, #e0e7ff, #c7d2fe)" }}>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                  <div className="bg-white/90 rounded-2xl px-4 py-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <Camera className="w-4 h-4" /> تغيير الغلاف
                  </div>
                </div>
                <div className="absolute bottom-3 right-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/80 backdrop-blur flex items-center justify-center text-lg shadow">
                    {restaurant?.logo ?? "🍽️"}
                  </div>
                </div>
              </div>

              {/* Category pills */}
              <div className="flex gap-2 flex-wrap mb-5">
                {/* Edit icon pill */}
                <button className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                  <Pencil className="w-4 h-4 text-white" />
                </button>
                {/* All pill */}
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedCategory === "all"
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
                  }`}
                >
                  {t.all}
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                      selectedCategory === cat.id
                        ? "bg-gray-900 text-white"
                        : "bg-white text-gray-600 border border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {cat.icon} {cat.name}
                  </button>
                ))}
                {/* Dashed add category */}
                <button className="flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold text-indigo-600 transition-all"
                  style={{ border: "2px dashed #6366f1" }}>
                  <Plus className="w-3.5 h-3.5" /> {t.newCategory}
                </button>
              </div>

              {/* Section header */}
              {categories.filter(c => selectedCategory === "all" || c.id === selectedCategory).map(cat => {
                const catItems = menuItems.filter(i => i.category_id === cat.id);
                return (
                  <div key={cat.id} className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-black text-gray-900 text-lg">{cat.icon} {cat.name}</h3>
                      <button
                        onClick={() => setShowAddItem(true)}
                        className="w-9 h-9 rounded-2xl bg-gray-900 flex items-center justify-center hover:bg-gray-700 transition-colors"
                      >
                        <Plus className="w-5 h-5 text-white" />
                      </button>
                    </div>

                    {/* 2-col product grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {catItems.map(item => (
                        <div key={item.id}
                          className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm group cursor-pointer hover:border-indigo-200 transition-all">
                          {/* Image */}
                          <div className="relative h-32 bg-gray-100 flex items-center justify-center text-4xl">
                            {item.image
                              ? <img src={item.image} className="w-full h-full object-cover" />
                              : <span>{item.image ?? "🍽️"}</span>
                            }
                            {/* Delete on hover */}
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {/* Info */}
                          <div className="p-3">
                            <p className="text-sm font-black text-gray-900">من {item.price} {t.currency}</p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{item.name}</p>
                            {item.is_popular && (
                              <p className="text-[10px] text-gray-400 mt-1">🔥 {t.popular}</p>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Add item dashed card */}
                      <button
                        onClick={() => setShowAddItem(true)}
                        className="h-52 rounded-3xl flex flex-col items-center justify-center gap-2 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-colors"
                        style={{ border: "2px dashed #6366f1" }}
                      >
                        <Plus className="w-6 h-6" />
                        <span>{t.addItem}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* If no categories yet */}
              {categories.length === 0 && (
                <div className="text-center py-16">
                  <button
                    onClick={() => setShowAddItem(true)}
                    className="h-40 w-full rounded-3xl flex flex-col items-center justify-center gap-2 text-indigo-600 font-semibold text-sm"
                    style={{ border: "2px dashed #6366f1" }}
                  >
                    <Plus className="w-8 h-8" />
                    <span>{t.addItem}</span>
                  </button>
                </div>
              )}

              {/* Preview floating button */}
              <div className={`fixed bottom-8 ${dir === "rtl" ? "left-8" : "right-8"} z-40`}>
                <Link href={restaurant ? `/menu/${restaurant.id}` : "#"}>
                  <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-800 font-semibold text-sm px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all">
                    <Eye className="w-4 h-4" />
                    معاينة
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* ══ QR TAB (Menusa style) ══ */}
          {activeTab === "qr" && (
            <div className="max-w-xl space-y-6">

              {/* Main QR card */}
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6">
                  <h3 className="font-bold text-gray-900 mb-1">{t.restaurantQr}</h3>
                  <p className="text-sm text-gray-400 mb-5">{t.restaurantQrDesc}</p>

                  <div className="flex items-center justify-center py-8 bg-gray-50 rounded-3xl mb-5">
                    <div className="bg-white p-6 rounded-3xl shadow-md text-center">
                      <QrCode className="w-28 h-28 text-gray-900 mx-auto" />
                      <p className="mt-3 text-sm font-bold text-gray-900">{restaurant?.name ?? "—"}</p>
                      <p className="text-xs text-gray-400 mt-1">{t.scanToView}</p>
                    </div>
                  </div>

                  {/* Restaurant info card (Menusa preview) */}
                  <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
                        style={primaryStyle}>
                        {restaurant?.logo ?? "🍽️"}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{restaurant?.name ?? "—"}</p>
                        <p className="text-xs text-gray-400">08:00 — 21:00</p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <span>📷</span>
                      <span>@{restaurant?.name?.toLowerCase().replace(/\s/g, "") ?? "restaurant"}</span>
                    </div>
                  </div>

                  {/* Two action buttons */}
                  <div className="flex gap-3">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-4 rounded-2xl text-sm hover:bg-gray-800 transition-colors">
                      <Link2 className="w-4 h-4" />
                      {t.copyLink}
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-4 rounded-2xl text-sm hover:brightness-110 transition-all"
                      style={primaryStyle}>
                      <QrCode className="w-4 h-4" />
                      {t.downloadQr}
                    </button>
                  </div>
                </div>
              </div>

              {/* Table QRs */}
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">{t.tableQrs}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{tablesCount} {t.tableLabel}</p>
                  </div>
                  <button className="flex items-center gap-2 text-sm font-semibold text-indigo-600 border border-indigo-200 px-3 py-2 rounded-2xl hover:bg-indigo-50 transition-all">
                    <Download className="w-4 h-4" />
                    {t.downloadAll}
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4">
                  {Array.from({ length: tablesCount }, (_, i) => i + 1).map(table => (
                    <button
                      key={table}
                      onClick={() => setSelectedQrTable(selectedQrTable === table ? null : table)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                        selectedQrTable === table ? "border-indigo-400 bg-indigo-50 shadow-sm" : "border-gray-100 bg-white hover:border-indigo-200"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selectedQrTable === table ? "" : "bg-gray-100"}`}
                        style={selectedQrTable === table ? primaryStyle : {}}>
                        <QrCode className={`w-5 h-5 ${selectedQrTable === table ? "text-white" : "text-gray-400"}`} />
                      </div>
                      <span className="text-xs font-bold text-gray-700">{t.tableLabel} {table}</span>
                    </button>
                  ))}
                </div>
                {selectedQrTable && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50">
                    <div className="flex items-center gap-5 mb-4">
                      <div className="bg-white p-4 rounded-2xl shadow-sm">
                        <QrCode className="w-20 h-20 text-gray-900" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 mb-1">{restaurant?.name ?? "—"} — {t.tableLabel} {selectedQrTable}</p>
                        <p className="text-sm text-gray-400">/menu/{restaurant?.id}?table={selectedQrTable}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button className="flex-1 bg-gray-900 text-white text-sm font-bold py-3 rounded-2xl hover:bg-gray-800 transition-colors">
                        {t.downloadPng}
                      </button>
                      <button className="flex-1 border border-gray-200 text-sm font-semibold text-gray-700 py-3 rounded-2xl hover:bg-gray-100 transition-colors">
                        {t.copyLink}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ ORDERS TAB ══ */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(["all", "pending", "preparing", "ready", "delivered"] as const).map(s => (
                  <button
                    key={s}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                      s === "all" ? "border-transparent text-white" : ""
                    } ${
                      s === "pending" ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                      : s === "preparing" ? "border-blue-200 bg-blue-50 text-blue-700"
                      : s === "ready" ? "border-green-200 bg-green-50 text-green-700"
                      : s === "delivered" ? "border-gray-200 bg-gray-100 text-gray-500"
                      : ""
                    }`}
                    style={s === "all" ? primaryStyle : {}}
                  >
                    {s === "all"
                      ? `${t.statusAll} (${orders.length})`
                      : `${STATUS_CONFIG[s].label} (${orders.filter(o => o.status === s).length})`
                    }
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {orders.map(order => {
                  const cfg = STATUS_CONFIG[order.status];
                  return (
                    <div key={order.id} className={`bg-white border rounded-3xl p-5 transition-all shadow-sm ${
                      order.status === "pending" ? "border-indigo-200" : "border-gray-100"
                    }`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white"
                            style={primaryStyle}>
                            {order.table_number}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{t.tableNo} {order.table_number}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(order.created_at).toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        {(order.items as { item_id: string; item_name: string; price: number; quantity: number }[]).map((line, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <span className="text-base">🍽️</span>
                            <span className="flex-1 text-gray-700">{line.item_name}</span>
                            <span className="text-gray-400">×{line.quantity}</span>
                            <span className="font-semibold text-gray-900">{(line.price * line.quantity).toFixed(2)} {t.currency}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div>
                          <span className="text-xs text-gray-400">{t.total}: </span>
                          <span className="font-black text-indigo-600">{order.total} {t.currency}</span>
                        </div>
                        {cfg.next && (
                          <button
                            onClick={() => advanceOrder(order.id)}
                            className="text-white text-sm font-bold px-4 py-2 rounded-2xl hover:brightness-110 transition-all"
                            style={primaryStyle}
                          >
                            {cfg.nextLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {orders.length === 0 && (
                  <div className="text-center py-16">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-400">لا طلبات حالياً</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ SETTINGS TAB ══ */}
          {activeTab === "settings" && (
            <div className="max-w-xl space-y-4">
              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center"
                    style={{ background: "#eef2ff" }}>
                    <Globe className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{t.languageSection}</p>
                    <p className="text-xs text-gray-400">{t.languageDesc}</p>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {(["ar", "en"] as Lang[]).map(l => (
                    <label
                      key={l}
                      onClick={() => setPendingLang(l)}
                      className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        pendingLang === l ? "border-indigo-500 bg-indigo-50" : "border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{l === "ar" ? "🇸🇦" : "🇺🇸"}</span>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">
                            {l === "ar" ? t.arabic : t.english}
                          </p>
                          <p className="text-xs text-gray-400">
                            {l === "ar" ? "RTL — من اليمين لليسار" : "LTR — Left to right"}
                          </p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        pendingLang === l ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                      }`}>
                        {pendingLang === l && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </label>
                  ))}
                </div>
                <div className="px-5 pb-5">
                  <button
                    onClick={handleSaveSettings}
                    className="w-full text-white font-bold py-3.5 rounded-2xl hover:brightness-110 transition-all"
                    style={primaryStyle}
                  >
                    {settingsSaved ? t.settingsSaved : t.saveSettings}
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-xl bg-gray-50">
                    {restaurant?.logo ?? "🍽️"}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-900">{t.restaurantInfo}</p>
                    <p className="text-xs text-gray-400">{t.restaurantInfoDesc}</p>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: lang === "ar" ? "الاسم" : "Name", value: restaurant?.name ?? "—" },
                    { label: lang === "ar" ? "الباقة" : "Plan", value: planLabel(restaurant?.plan) },
                    { label: lang === "ar" ? "عدد الطاولات" : "Tables", value: String(restaurant?.tables_count ?? "—") },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center text-sm py-1">
                      <span className="text-gray-400">{row.label}</span>
                      <span className="font-semibold text-gray-900">{row.value}</span>
                    </div>
                  ))}
                  <button className="w-full mt-2 border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl hover:bg-gray-50 transition-all text-sm">
                    {t.editInfo}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── Item Modal ── */}
      <ItemModal
        open={showAddItem}
        onClose={() => setShowAddItem(false)}
        categories={categories}
      />
    </div>
  );
}
