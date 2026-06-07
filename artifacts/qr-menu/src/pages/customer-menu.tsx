import { useState, useEffect } from "react";
import { Search, ChevronRight, Loader2 } from "lucide-react";
import { useParams } from "wouter";
import type { MenuItemRow, CategoryRow, RestaurantRow } from "@/lib/database.types";
import { getRestaurantById, getCategories, getMenuItems } from "@/lib/api";

export default function CustomerMenuPage() {
  const params = useParams<{ restaurantId: string }>();
  const restaurantId = params.restaurantId;

  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<MenuItemRow | null>(null);
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
    if (!item.is_available) return false;
    const matchesCat = activeCategory === "all" || item.category_id === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const coverBg = restaurant?.cover_color?.startsWith("data:")
    ? undefined
    : (restaurant?.cover_color ?? "#7c3aed");

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap'); * { font-family: 'Cairo', sans-serif; }`}</style>

      {/* ── Restaurant header ── */}
      <div className="relative" style={{ background: coverBg }}>
        {restaurant?.cover_color?.startsWith("data:") && (
          <img src={restaurant.cover_color} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative px-4 pt-10 pb-8 text-center">
          <button
            onClick={() => window.history.back()}
            className="absolute top-4 right-4 w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-4xl mx-auto mb-3 shadow-xl">
            {restaurant?.logo ?? "🍽️"}
          </div>
          <h1 className="text-2xl font-black text-white">{restaurant?.name ?? "المنيو"}</h1>
          {restaurant?.description && (
            <p className="text-white/80 text-sm mt-1">{restaurant.description}</p>
          )}
          <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            قائمة الطعام
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-4 -mt-5 relative z-10 mb-2">
        <div className="bg-white rounded-2xl flex items-center gap-3 px-4 py-3 shadow-md">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-gray-400 text-gray-800"
            placeholder="ابحث في المنيو..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div className="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-md pt-3 pb-2 border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setActiveCategory("all")}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeCategory === "all"
                ? "text-white shadow-sm"
                : "bg-white text-gray-500 border border-gray-200"
            }`}
            style={activeCategory === "all" ? { background: "linear-gradient(135deg, #7c3aed, #6366f1)" } : {}}
          >
            الكل
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeCategory === cat.id
                  ? "text-white shadow-sm"
                  : "bg-white text-gray-500 border border-gray-200"
              }`}
              style={activeCategory === cat.id ? { background: "linear-gradient(135deg, #7c3aed, #6366f1)" } : {}}
            >
              <span>{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Menu items ── */}
      <div className="p-4 space-y-3 pb-10">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-gray-400 text-sm">لا توجد أصناف في هذا القسم</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="w-full bg-white rounded-2xl p-4 flex gap-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-right"
            >
              <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                {item.image?.startsWith("data:") || item.image?.startsWith("http")
                  ? <img src={item.image} className="w-full h-full object-cover" />
                  : <span>{item.image ?? "🍽️"}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-1 mb-1">
                  <p className="font-bold text-sm text-gray-900 leading-snug flex-1">{item.name}</p>
                  {item.is_popular && (
                    <span className="text-xs bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded-full shrink-0">🔥</span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-gray-400 line-clamp-2 mb-2">{item.description}</p>
                )}
                <span className="font-black text-indigo-600 text-base">{item.price} ر.س</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* ── Item detail bottom sheet (view only) ── */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white w-full rounded-t-3xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Image */}
            <div className="mx-4 mt-2 mb-4 h-48 bg-gray-100 rounded-3xl flex items-center justify-center text-7xl overflow-hidden">
              {selectedItem.image?.startsWith("data:") || selectedItem.image?.startsWith("http")
                ? <img src={selectedItem.image} className="w-full h-full object-cover" />
                : <span>{selectedItem.image ?? "🍽️"}</span>
              }
            </div>

            <div className="px-5 pb-8 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-black text-xl text-gray-900 leading-tight flex-1">
                  {selectedItem.name}
                  {selectedItem.is_popular && <span className="text-sm mr-2">🔥</span>}
                </h2>
                <span className="font-black text-2xl text-indigo-600 shrink-0">{selectedItem.price} ر.س</span>
              </div>

              {selectedItem.description && (
                <p className="text-sm text-gray-500 leading-relaxed">{selectedItem.description}</p>
              )}

              {selectedItem.extras && selectedItem.extras.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">الإضافات المتاحة</p>
                  <div className="space-y-2">
                    {selectedItem.extras.map((extra, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{extra.name}</span>
                        <span className="font-bold text-indigo-600">+{extra.price} ر.س</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedItem(null)}
                className="w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl text-sm hover:bg-gray-200 transition-colors mt-2"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
