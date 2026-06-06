import { useState } from "react";
import {
  LayoutDashboard, UtensilsCrossed, QrCode, ShoppingBag,
  Plus, Pencil, Trash2, Bell, LogOut,
  CheckCircle2, Clock, ChefHat, Truck, X, Settings,
  TrendingUp, Star, DollarSign, Table2, Eye
} from "lucide-react";
import {
  MOCK_RESTAURANT, MOCK_CATEGORIES, MOCK_MENU_ITEMS,
  MOCK_ORDERS, type Order, type OrderStatus, type MenuItem
} from "@/data/mock";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";

type Tab = "overview" | "menu" | "qr" | "orders";

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ReactNode; next?: OrderStatus; nextLabel?: string }> = {
  pending:   { label: "انتظار",   color: "bg-yellow-100 text-yellow-700 border-yellow-200",  icon: <Clock className="w-3.5 h-3.5" />,       next: "preparing", nextLabel: "بدء التحضير" },
  preparing: { label: "يُحضَّر",  color: "bg-blue-100 text-blue-700 border-blue-200",        icon: <ChefHat className="w-3.5 h-3.5" />,      next: "ready",     nextLabel: "جاهز للتسليم" },
  ready:     { label: "جاهز",    color: "bg-green-100 text-green-700 border-green-200",      icon: <CheckCircle2 className="w-3.5 h-3.5" />, next: "delivered", nextLabel: "تم التسليم" },
  delivered: { label: "سُلِّم",  color: "bg-gray-100 text-gray-500 border-gray-200",         icon: <Truck className="w-3.5 h-3.5" /> },
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddItem, setShowAddItem] = useState(false);
  const [selectedQrTable, setSelectedQrTable] = useState<number | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  const pendingCount = orders.filter(o => o.status === "pending").length;

  const advanceOrder = (id: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== id) return o;
      const cfg = STATUS_CONFIG[o.status];
      return cfg.next ? { ...o, status: cfg.next } : o;
    }));
  };

  const filteredItems = selectedCategory === "all"
    ? MOCK_MENU_ITEMS
    : MOCK_MENU_ITEMS.filter(i => i.categoryId === selectedCategory);

  const navItems: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: "overview", label: "نظرة عامة",   icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: "menu",     label: "إدارة المنيو", icon: <UtensilsCrossed className="w-5 h-5" /> },
    { id: "qr",       label: "أكواد QR",     icon: <QrCode className="w-5 h-5" /> },
    { id: "orders",   label: "الطلبات",      icon: <ShoppingBag className="w-5 h-5" />, badge: pendingCount },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-l border-border flex flex-col shrink-0">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-xl shadow-sm">
              {MOCK_RESTAURANT.logo}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground truncate">{user?.restaurantName || MOCK_RESTAURANT.name}</p>
              <span className="text-xs bg-accent text-primary font-semibold px-2 py-0.5 rounded-full">
                {(user?.plan || MOCK_RESTAURANT.plan) === "pro" ? "احترافي" : (user?.plan || MOCK_RESTAURANT.plan) === "enterprise" ? "مؤسسي" : "مجاني"}
              </span>
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
              {item.badge ? (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${activeTab === item.id ? "bg-white/30 text-white" : "bg-primary text-white"}`}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground transition-all">
            <Settings className="w-5 h-5" />
            <span>الإعدادات</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-bold text-lg text-foreground">
              {navItems.find(n => n.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-muted-foreground">مرحباً، {user?.name || MOCK_RESTAURANT.owner} 👋</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative w-9 h-9 rounded-xl border border-border bg-background flex items-center justify-center hover:bg-accent/50 transition-colors"
              >
                <Bell className="w-4 h-4 text-muted-foreground" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -left-1 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute left-0 top-11 w-64 bg-card border border-border rounded-2xl shadow-lg z-50 overflow-hidden">
                  <div className="p-3 border-b border-border">
                    <p className="font-bold text-sm text-foreground">الإشعارات</p>
                  </div>
                  {orders.filter(o => o.status === "pending").map(o => (
                    <div key={o.id} className="p-3 border-b border-border last:border-0 hover:bg-accent/30">
                      <p className="text-sm font-medium text-foreground">طلب جديد — طاولة {o.tableNumber}</p>
                      <p className="text-xs text-muted-foreground">{o.items.length} أصناف • {o.total} ر.س</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link href="/menu/rest-1">
              <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground border border-border px-3 py-2 rounded-xl hover:bg-accent/50 transition-colors">
                <Eye className="w-4 h-4" />
                معاينة المنيو
              </button>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "إجمالي الطلبات اليوم", value: "24", icon: <ShoppingBag className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-50" },
                  { label: "الإيرادات اليوم", value: "1,840 ر.س", icon: <DollarSign className="w-5 h-5" />, color: "text-green-600", bg: "bg-green-50" },
                  { label: "متوسط قيمة الطلب", value: "76 ر.س", icon: <TrendingUp className="w-5 h-5" />, color: "text-primary", bg: "bg-accent" },
                  { label: "الطاولات النشطة", value: `${orders.filter(o => o.status !== "delivered").length}/${MOCK_RESTAURANT.tables}`, icon: <Table2 className="w-5 h-5" />, color: "text-purple-600", bg: "bg-purple-50" },
                ].map((stat, i) => (
                  <div key={i} className="bg-card border border-border rounded-2xl p-5">
                    <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                      {stat.icon}
                    </div>
                    <p className="text-2xl font-black text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent orders */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h2 className="font-bold text-foreground">آخر الطلبات</h2>
                  <button onClick={() => setActiveTab("orders")} className="text-xs text-primary font-medium hover:underline">عرض الكل</button>
                </div>
                <div className="divide-y divide-border">
                  {orders.slice(0, 4).map(order => {
                    const cfg = STATUS_CONFIG[order.status];
                    return (
                      <div key={order.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center font-bold text-sm text-primary">
                            {order.tableNumber}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">طاولة {order.tableNumber}</p>
                            <p className="text-xs text-muted-foreground">{order.items.length} صنف • {order.total} ر.س</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top selling items */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border">
                  <h2 className="font-bold text-foreground">الأصناف الأكثر طلباً</h2>
                </div>
                <div className="p-4 space-y-3">
                  {MOCK_MENU_ITEMS.filter(i => i.popular).map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <span className="text-lg w-8 text-center">{item.image}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${85 - idx * 15}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{85 - idx * 15}%</span>
                        </div>
                      </div>
                      <Star className="w-4 h-4 fill-primary text-primary" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MENU TAB */}
          {activeTab === "menu" && (
            <div className="space-y-5">
              {/* Categories bar */}
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-foreground">الأقسام</h3>
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:bg-accent/50 px-3 py-1.5 rounded-lg transition-colors">
                    <Plus className="w-3.5 h-3.5" /> قسم جديد
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === "all" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent/60"}`}
                  >
                    الكل ({MOCK_MENU_ITEMS.length})
                  </button>
                  {MOCK_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat.id ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent/60"}`}
                    >
                      <span>{cat.icon}</span>
                      {cat.name} ({MOCK_MENU_ITEMS.filter(i => i.categoryId === cat.id).length})
                    </button>
                  ))}
                </div>
              </div>

              {/* Add item button */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">{filteredItems.length} صنف</p>
                <button
                  onClick={() => setShowAddItem(true)}
                  className="flex items-center gap-2 bg-primary text-white font-semibold text-sm px-4 py-2 rounded-xl hover:brightness-110 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" /> إضافة صنف
                </button>
              </div>

              {/* Items grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredItems.map(item => {
                  const cat = MOCK_CATEGORIES.find(c => c.id === item.categoryId);
                  return (
                    <div key={item.id} className="bg-card border border-border rounded-2xl p-4 flex gap-3 hover:border-primary/30 transition-all group">
                      <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center text-2xl shrink-0">
                        {item.image}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                          </div>
                          <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive/70 hover:text-destructive transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm font-black text-primary">{item.price} ر.س</span>
                          <div className="flex items-center gap-1.5">
                            {item.popular && <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">🔥 رائج</span>}
                            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{cat?.icon} {cat?.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* QR TAB */}
          {activeTab === "qr" && (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-foreground mb-1">كود QR للمطعم كاملاً</h3>
                    <p className="text-sm text-muted-foreground">يفتح المنيو العام بدون تحديد طاولة</p>
                  </div>
                  <button className="flex items-center gap-2 bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:brightness-110 transition-all">
                    تحميل QR
                  </button>
                </div>
                <div className="flex items-center justify-center py-8 bg-muted/40 rounded-2xl">
                  <div className="bg-white p-6 rounded-2xl shadow-md text-center">
                    <QrCode className="w-32 h-32 text-foreground mx-auto" />
                    <p className="mt-3 text-sm font-bold text-foreground">{MOCK_RESTAURANT.name}</p>
                    <p className="text-xs text-muted-foreground">امسح لعرض المنيو</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-foreground">أكواد QR للطاولات</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{MOCK_RESTAURANT.tables} طاولة</p>
                  </div>
                  <button className="flex items-center gap-2 text-sm font-semibold text-primary border border-primary/30 px-3 py-2 rounded-xl hover:bg-accent transition-all">
                    تحميل الكل
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 p-4">
                  {Array.from({ length: MOCK_RESTAURANT.tables }, (_, i) => i + 1).map(table => (
                    <button
                      key={table}
                      onClick={() => setSelectedQrTable(selectedQrTable === table ? null : table)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                        selectedQrTable === table ? "border-primary bg-accent shadow-sm" : "border-border bg-background hover:border-primary/40"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedQrTable === table ? "bg-primary" : "bg-muted"}`}>
                        <QrCode className={`w-5 h-5 ${selectedQrTable === table ? "text-white" : "text-muted-foreground"}`} />
                      </div>
                      <span className="text-xs font-bold text-foreground">طاولة {table}</span>
                    </button>
                  ))}
                </div>
                {selectedQrTable && (
                  <div className="border-t border-border p-5 bg-accent/30">
                    <div className="flex items-center gap-6">
                      <div className="bg-white p-4 rounded-2xl shadow-sm">
                        <QrCode className="w-20 h-20 text-foreground" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground mb-1">{MOCK_RESTAURANT.name} — طاولة {selectedQrTable}</p>
                        <p className="text-sm text-muted-foreground mb-4">رابط: menu.example.com/rest-1?table={selectedQrTable}</p>
                        <div className="flex gap-2">
                          <button className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:brightness-110 transition-all">تحميل PNG</button>
                          <button className="border border-border text-sm font-medium text-foreground px-4 py-2 rounded-xl hover:bg-card transition-all">نسخ الرابط</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {/* Status filter */}
              <div className="flex gap-2 flex-wrap">
                {(["all", "pending", "preparing", "ready", "delivered"] as const).map(s => (
                  <button
                    key={s}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                      s === "all"
                        ? "bg-primary text-white border-primary"
                        : s === "pending" ? "border-yellow-200 bg-yellow-50 text-yellow-700"
                        : s === "preparing" ? "border-blue-200 bg-blue-50 text-blue-700"
                        : s === "ready" ? "border-green-200 bg-green-50 text-green-700"
                        : "border-border bg-muted text-muted-foreground"
                    }`}
                  >
                    {s === "all" ? `الكل (${orders.length})` : `${STATUS_CONFIG[s].label} (${orders.filter(o => o.status === s).length})`}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {orders.map(order => {
                  const cfg = STATUS_CONFIG[order.status];
                  return (
                    <div key={order.id} className={`bg-card border rounded-2xl p-5 transition-all ${order.status === "pending" ? "border-primary/40 shadow-sm" : "border-border"}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center font-black text-lg text-primary">
                            {order.tableNumber}
                          </div>
                          <div>
                            <p className="font-bold text-foreground">طاولة رقم {order.tableNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${cfg.color}`}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </div>
                      <div className="space-y-2 mb-4">
                        {order.items.map(({ item, quantity }, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <span className="text-base">{item.image}</span>
                            <span className="flex-1 text-foreground">{item.name}</span>
                            <span className="text-muted-foreground">×{quantity}</span>
                            <span className="font-semibold text-foreground">{item.price * quantity} ر.س</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div>
                          <span className="text-xs text-muted-foreground">الإجمالي: </span>
                          <span className="font-black text-primary">{order.total} ر.س</span>
                        </div>
                        {cfg.next && (
                          <button
                            onClick={() => advanceOrder(order.id)}
                            className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-xl hover:brightness-110 transition-all"
                          >
                            {cfg.nextLabel}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add item modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-foreground">إضافة صنف جديد</h3>
              <button onClick={() => setShowAddItem(false)} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center hover:bg-accent transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">اسم الصنف *</label>
                <input className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" placeholder="مثال: دجاج مشوي" />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1.5">الوصف</label>
                <textarea className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none" rows={2} placeholder="وصف مختصر للصنف..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">السعر (ر.س) *</label>
                  <input type="number" className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1.5">القسم *</label>
                  <select className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
                    {MOCK_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddItem(false)} className="flex-1 border border-border text-foreground font-semibold py-2.5 rounded-xl hover:bg-accent/50 transition-all text-sm">
                  إلغاء
                </button>
                <button onClick={() => setShowAddItem(false)} className="flex-1 bg-primary text-white font-semibold py-2.5 rounded-xl hover:brightness-110 transition-all text-sm">
                  إضافة الصنف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
