import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, X, ChevronRight, CheckCircle2, Search, Loader2, Info } from "lucide-react";
import { useParams, useSearch } from "wouter";
import type { MenuItemRow, CategoryRow, RestaurantRow } from "@/lib/database.types";
import { getRestaurantById, getCategories, getMenuItems, createOrder } from "@/lib/api";

interface CartItem {
  item: MenuItemRow;
  quantity: number;
  selectedExtras: string[];
}

type Screen = "menu" | "cart" | "success";

export default function CustomerMenuPage() {
  const params = useParams<{ restaurantId: string }>();
  const search = useSearch();
  const restaurantId = params.restaurantId;
  const tableNum = parseInt(new URLSearchParams(search).get("table") ?? "1");

  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [screen, setScreen] = useState<Screen>("menu");
  const [selectedItem, setSelectedItem] = useState<MenuItemRow | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      setDataLoading(true);
      const [rest, cats, items] = await Promise.all([
        getRestaurantById(restaurantId),
        getCategories(restaurantId),
        getMenuItems(restaurantId),
      ]);
      setRestaurant(rest);
      setCategories(cats);
      setMenuItems(items);
      setDataLoading(false);
    })();
  }, [restaurantId]);

  const filteredItems = menuItems.filter(item => {
    const matchesCat = activeCategory === "all" || item.category_id === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);
  const cartTotal = cart.reduce((sum, c) => {
    const extrasTotal = c.selectedExtras.reduce((s, name) => {
      const ex = c.item.extras?.find(e => e.name === name);
      return s + (ex?.price ?? 0);
    }, 0);
    return sum + (c.item.price + extrasTotal) * c.quantity;
  }, 0);

  const addToCart = (item: MenuItemRow, extras: string[]) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { item, quantity: 1, selectedExtras: extras }];
    });
    setSelectedItem(null);
    setSelectedExtras([]);
  };

  const updateQty = (itemId: string, delta: number) => {
    setCart(prev =>
      prev.map(c => c.item.id === itemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
          .filter(c => c.quantity > 0)
    );
  };

  const getQty = (itemId: string) => cart.find(c => c.item.id === itemId)?.quantity ?? 0;

  const toggleExtra = (name: string) => {
    setSelectedExtras(prev => prev.includes(name) ? prev.filter(e => e !== name) : [...prev, name]);
  };

  const placeOrder = async () => {
    if (!restaurant) return;
    const orderItems = cart.map(({ item, quantity, selectedExtras: exs }) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity,
      extras: exs,
    }));
    await createOrder({
      restaurant_id: restaurant.id,
      table_number: tableNum,
      items: orderItems,
      status: "pending",
      total: cartTotal,
      customer_note: null,
    });
    setScreen("success");
    setTimeout(() => { setCart([]); setScreen("menu"); }, 4000);
  };

  /* ── Success screen ── */
  if (screen === "success") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center" dir="rtl">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h1 className="text-2xl font-black text-foreground mb-2">تم استلام طلبك! 🎉</h1>
        <p className="text-muted-foreground mb-2">طاولة رقم <strong>{tableNum}</strong></p>
        <p className="text-sm text-muted-foreground">سيتم تحضير طلبك قريباً وإيصاله إليك.</p>
        <div className="mt-8 bg-card border border-border rounded-2xl p-4 w-full max-w-xs">
          <p className="text-xs text-muted-foreground mb-3">ملخص الطلب</p>
          {cart.map(({ item, quantity }) => (
            <div key={item.id} className="flex justify-between text-sm py-1">
              <span className="text-foreground">{item.name} ×{quantity}</span>
              <span className="text-muted-foreground">{item.price * quantity} ر.س</span>
            </div>
          ))}
          <div className="border-t border-border mt-2 pt-2 flex justify-between font-bold text-sm">
            <span>الإجمالي</span>
            <span className="text-primary">{cartTotal} ر.س</span>
          </div>
        </div>
      </div>
    );
  }

  /* ── Cart screen ── */
  if (screen === "cart") {
    return (
      <div className="min-h-screen bg-background flex flex-col" dir="rtl">
        <header className="bg-card border-b border-border px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setScreen("menu")} className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center">
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-foreground">سلة الطلب</h1>
            <p className="text-xs text-muted-foreground">طاولة {tableNum}</p>
          </div>
          <span className="text-xs font-bold text-primary">{cartCount} صنف</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">سلتك فارغة</p>
            </div>
          ) : (
            cart.map(({ item, quantity, selectedExtras: exs }) => (
              <div key={item.id} className="bg-card border border-border rounded-2xl p-4 flex gap-3">
                <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center text-2xl shrink-0">
                  {item.image ?? "🍽️"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground">{item.name}</p>
                  {exs.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">+ {exs.join("، ")}</p>
                  )}
                  <p className="text-sm font-black text-primary mt-1">{item.price} ر.س</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-5 text-center font-bold text-sm">{quantity}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white hover:brightness-110 transition-all">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-4 bg-card border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">إجمالي الطلب</span>
              <span className="text-xl font-black text-primary">{cartTotal} ر.س</span>
            </div>
            <button
              onClick={placeOrder}
              className="w-full bg-primary text-white font-bold py-4 rounded-2xl text-base hover:brightness-110 transition-all shadow-md"
            >
              تأكيد الطلب 🚀
            </button>
            <p className="text-center text-xs text-muted-foreground mt-2">سيتم إرسال طلبك مباشرة للمطبخ</p>
          </div>
        )}
      </div>
    );
  }

  /* ── Main menu screen ── */
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Restaurant header */}
      <div className="relative" style={{ background: `linear-gradient(135deg, ${restaurant?.cover_color ?? "#7c3aed"}, ${restaurant?.cover_color ?? "#7c3aed"}cc)` }}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative px-4 pt-8 pb-6 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
            {restaurant?.logo ?? "🍽️"}
          </div>
          <h1 className="text-xl font-black text-white">{restaurant?.name ?? "المنيو"}</h1>
          <p className="text-white/80 text-sm mt-1">{restaurant?.description ?? ""}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            طاولة رقم {tableNum}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 -mt-4 relative z-10 mb-1">
        <div className="bg-card border border-border rounded-2xl flex items-center gap-3 px-4 py-3 shadow-sm">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground"
            placeholder="ابحث في المنيو..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md pt-3 pb-2 border-b border-border">
        <div className="flex gap-2 overflow-x-auto px-4 scrollbar-none">
          <button
            onClick={() => setActiveCategory("all")}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeCategory === "all" ? "bg-primary text-white shadow-sm" : "bg-muted text-muted-foreground"}`}
          >
            الكل
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeCategory === cat.id ? "bg-primary text-white shadow-sm" : "bg-muted text-muted-foreground"}`}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="p-4 space-y-3 pb-32">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">لا توجد نتائج</p>
          </div>
        ) : (
          filteredItems.map(item => {
            const qty = getQty(item.id);
            return (
              <div key={item.id} className="bg-card border border-border rounded-2xl p-4 flex gap-3">
                <button
                  onClick={() => { setSelectedItem(item); setSelectedExtras([]); }}
                  className="w-20 h-20 bg-accent rounded-xl flex items-center justify-center text-4xl shrink-0 hover:scale-105 transition-transform"
                >
                  {item.image ?? "🍽️"}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1">
                    <p className="font-bold text-sm text-foreground leading-snug flex-1">{item.name}</p>
                    {item.is_popular && <span className="text-xs bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded-full shrink-0">🔥</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-black text-primary">{item.price} ر.س</span>
                    {qty === 0 ? (
                      <button
                        onClick={() => item.extras?.length ? (setSelectedItem(item), setSelectedExtras([])) : addToCart(item, [])}
                        className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white hover:brightness-110 transition-all shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground hover:bg-destructive/10 transition-colors">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center font-bold text-sm">{qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white hover:brightness-110 transition-all">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 z-30">
          <button
            onClick={() => setScreen("cart")}
            className="w-full bg-primary text-white font-bold py-4 rounded-2xl flex items-center justify-between px-5 shadow-xl hover:brightness-110 transition-all"
          >
            <span className="bg-white/20 text-white text-xs font-black w-7 h-7 rounded-xl flex items-center justify-center">
              {cartCount}
            </span>
            <span className="text-base">عرض الطلب</span>
            <span className="font-black">{cartTotal} ر.س</span>
          </button>
        </div>
      )}

      {/* Item detail modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-card w-full rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-card pt-4 px-4 pb-2 flex items-center justify-between border-b border-border">
              <h3 className="font-bold text-foreground">{selectedItem.name}</h3>
              <button onClick={() => setSelectedItem(null)} className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="p-4 space-y-5">
              <div className="w-24 h-24 bg-accent rounded-2xl flex items-center justify-center text-5xl mx-auto">
                {selectedItem.image ?? "🍽️"}
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{selectedItem.description}</p>
                <p className="text-2xl font-black text-primary mt-2">{selectedItem.price} ر.س</p>
              </div>

              {selectedItem.extras && selectedItem.extras.length > 0 && (
                <div>
                  <p className="font-bold text-sm text-foreground mb-3 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-primary" /> الإضافات الاختيارية
                  </p>
                  <div className="space-y-2">
                    {selectedItem.extras.map(extra => (
                      <label key={extra.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selectedExtras.includes(extra.name) ? "bg-primary border-primary" : "border-border"}`}
                            onClick={() => toggleExtra(extra.name)}>
                            {selectedExtras.includes(extra.name) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className="text-sm font-medium text-foreground">{extra.name}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">+{extra.price} ر.س</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => addToCart(selectedItem, selectedExtras)}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl hover:brightness-110 transition-all shadow-md"
              >
                إضافة للطلب — {selectedItem.price + selectedExtras.reduce((s, n) => s + (selectedItem.extras?.find(e => e.name === n)?.price ?? 0), 0)} ر.س
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
