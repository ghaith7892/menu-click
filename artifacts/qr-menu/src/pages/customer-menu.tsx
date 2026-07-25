import { useState, useEffect, useRef } from "react";
import { Search, ChevronRight, Loader2 } from "lucide-react";
import { useParams, useLocation } from "wouter";
import type { MenuItemRow, CategoryRow, RestaurantRow } from "@/lib/database.types";
import { getRestaurantById, getCategories, getMenuItemsNoImage, loadAllImages } from "@/lib/api";
import { getCurrencySymbol } from "@/lib/currencies";

const customerT = {
  ar: {
    back: "رجوع",
    menuLabel: "قائمة الطعام",
    searchPlaceholder: "ابحث في المنيو...",
    all: "الكل",
    noItems: "لا توجد أصناف في هذا القسم",
    availableExtras: "الإضافات المتاحة",
    close: "إغلاق",
    menuFallback: "المنيو",
    font: "'Cairo', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap",
  },
  en: {
    back: "Back",
    menuLabel: "Menu",
    searchPlaceholder: "Search the menu...",
    all: "All",
    noItems: "No items in this category",
    availableExtras: "Available Extras",
    close: "Close",
    menuFallback: "Menu",
    font: "'Inter', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
  },
} as const;

/* ─── Lazy image with fade-in ────────────────────────────────────────────────
 * For Storage URL images: src is already in props → renders immediately.
 * For base64/null images:  src arrives later (from Phase 2 batch) → fades in.
 * Uses native loading="lazy" — the browser handles viewport detection natively,
 * which is faster and more memory-efficient than IntersectionObserver per item.
 * --------------------------------------------------------------------------- */
function MenuImage({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className: string;
}) {
  const [loaded, setLoaded] = useState(false);

  if (!src) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
        <span className="text-3xl">🍽️</span>
      </div>
    );
  }

  return (
    <div className={`${className} bg-gray-100 overflow-hidden relative`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl">🍽️</span>
        </div>
      )}
    </div>
  );
}

export default function CustomerMenuPage() {
  const params = useParams<{ restaurantId: string }>();
  const restaurantId = params.restaurantId;
  const [, navigate] = useLocation();

  const [restaurant, setRestaurant] = useState<RestaurantRow | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItemRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<MenuItemRow | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // Separate image state so image updates don't re-render the whole list structure
  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;
    (async () => {
      setDataLoading(true);

      // ── Phase 1: text + metadata + Storage URLs ──────────────────────────
      // Payload is tiny (a few KB). Updated RPC returns Storage URLs but skips
      // base64 blobs. Storage URL items get images here — no Phase 2 needed.
      const [rest, cats, items] = await Promise.all([
        getRestaurantById(restaurantId),
        getCategories(restaurantId),
        getMenuItemsNoImage(restaurantId), // now returns Storage URLs inline
      ]);
      if (cancelled) return;
      setRestaurant(rest);
      setCategories(cats);
      setMenuItems(items);

      // Seed imageMap with any Storage URLs already in Phase 1 data
      const phase1Images: Record<string, string> = {};
      for (const item of items) {
        if (item.image) phase1Images[item.id] = item.image;
      }
      if (Object.keys(phase1Images).length > 0) setImageMap(phase1Images);
      setDataLoading(false);

      // ── Phase 2: batch-load remaining (base64) images ────────────────────
      // Single network request for ALL missing images.
      // loadAllImages() has a 5-minute module-level cache — repeat QR scans
      // within the same browser session return instantly from memory.
      if (items.some(i => !i.image)) {
        loadAllImages(restaurantId).then(all => {
          if (!cancelled && Object.keys(all).length > 0) {
            setImageMap(all); // merge replaces map — includes phase1 URLs too
          }
        });
      }
    })();
    return () => { cancelled = true; };
  }, [restaurantId]);

  // selectedItem tracks the full item; keep its image in sync when imageMap updates
  const selectedItemWithImage = selectedItem
    ? { ...selectedItem, image: imageMap[selectedItem.id] ?? selectedItem.image }
    : null;

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
  const currencySymbol = getCurrencySymbol(restaurant?.currency);
  const clang = restaurant?.language ?? "ar";
  const cdir = clang === "ar" ? "rtl" : "ltr";
  const ct = customerT[clang];

  return (
    <div className="min-h-screen bg-gray-50" dir={cdir}>
      <style>{`@import url('${ct.fontUrl}'); * { font-family: ${ct.font}; }`}</style>

      {/* ── Restaurant header ── */}
      <div className="relative" style={{ background: coverBg }}>
        {restaurant?.cover_color?.startsWith("data:") && (
          <img src={restaurant.cover_color} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative px-4 pt-10 pb-8 text-center">
          <button
            onClick={() => navigate("/dashboard")}
            className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/25 backdrop-blur-md text-white text-sm font-bold px-3 py-2 rounded-2xl hover:bg-white/40 transition-colors shadow-sm"
          >
            <ChevronRight className={`w-4 h-4 ${cdir === "ltr" ? "rotate-180" : ""}`} />
            {ct.back}
          </button>
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-4xl mx-auto mb-3 shadow-xl">
            {restaurant?.logo ?? "🍽️"}
          </div>
          <h1 className="text-2xl font-black text-white">{restaurant?.name ?? ct.menuFallback}</h1>
          {restaurant?.description && (
            <p className="text-white/80 text-sm mt-1">{restaurant.description}</p>
          )}
          <div className="mt-3 inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            {ct.menuLabel}
          </div>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-4 -mt-5 relative z-10 mb-2">
        <div className="bg-white rounded-2xl flex items-center gap-3 px-4 py-3 shadow-md">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-gray-400 text-gray-800"
            placeholder={ct.searchPlaceholder}
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
              activeCategory === "all" ? "text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200"
            }`}
            style={activeCategory === "all" ? { background: "linear-gradient(135deg, #7c3aed, #6366f1)" } : {}}
          >
            {ct.all}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeCategory === cat.id ? "text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200"
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
            <p className="text-gray-400 text-sm">{ct.noItems}</p>
          </div>
        ) : (
          filteredItems.map(item => (
            <button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className={`w-full bg-white rounded-2xl p-4 flex gap-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow ${cdir === "rtl" ? "text-right" : "text-left"}`}
            >
              {/* Image: Storage URLs render immediately; base64 fades in from Phase 2 */}
              <MenuImage
                src={imageMap[item.id] ?? item.image}
                alt={item.name}
                className="w-20 h-20 rounded-xl shrink-0"
              />
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
                <span className="font-black text-indigo-600 text-base">{item.price} {currencySymbol}</span>
              </div>
            </button>
          ))
        )}
      </div>

      {/* ── Item detail bottom sheet ── */}
      {selectedItemWithImage && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white w-full rounded-t-3xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <MenuImage
              src={selectedItemWithImage.image}
              alt={selectedItemWithImage.name}
              className="mx-4 mt-2 mb-4 h-48 rounded-3xl"
            />
            <div className="px-5 pb-8 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-black text-xl text-gray-900 leading-tight flex-1">
                  {selectedItemWithImage.name}
                  {selectedItemWithImage.is_popular && <span className="text-sm mr-2">🔥</span>}
                </h2>
                <span className="font-black text-2xl text-indigo-600 shrink-0">
                  {selectedItemWithImage.price} {currencySymbol}
                </span>
              </div>
              {selectedItemWithImage.description && (
                <p className="text-sm text-gray-500 leading-relaxed">{selectedItemWithImage.description}</p>
              )}
              {selectedItemWithImage.extras && selectedItemWithImage.extras.length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">{ct.availableExtras}</p>
                  <div className="space-y-2">
                    {selectedItemWithImage.extras.map((extra, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{extra.name}</span>
                        <span className="font-bold text-indigo-600">+{extra.price} {currencySymbol}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-2xl text-sm hover:bg-gray-200 transition-colors mt-2"
              >
                {ct.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
