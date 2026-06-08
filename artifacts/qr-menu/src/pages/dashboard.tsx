import { useState, useEffect, useRef } from "react";
import {
  UtensilsCrossed, QrCode,
  Trash2, LogOut,
  X, Settings,
  Eye, Loader2, Globe,
  Plus, Minus, Camera, Link2, Pencil, CheckCircle2
} from "lucide-react";
import type { CategoryRow, MenuItemRow, RestaurantRow } from "@/lib/database.types";
import {
  getRestaurantByOwner, getCategories, getMenuItems,
  deleteMenuItem, createMenuItem,
  createCategory, updateRestaurant
} from "@/lib/api";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/auth-context";
import { useLang, type Lang } from "@/context/lang-context";

type Tab = "menu" | "qr" | "settings";
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
  open, onClose, categories, restaurantId, onAdd,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryRow[];
  restaurantId: string;
  onAdd: (item: MenuItemRow) => void;
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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setName(""); setDescription(""); setPhoto(null);
    setHideFromMenu(false); setOutOfStock(false); setSaveError("");
    setVariations([{ id: "1", name: "", price: "", amount: "" }]);
    setSelectedCat(categories[0]?.id ?? "");
  };

  const handleClose = () => { resetForm(); onClose(); };

  const handleSubmit = async () => {
    if (!name.trim()) { setSaveError("يرجى إدخال اسم الصنف"); return; }
    if (!selectedCat) { setSaveError("يرجى اختيار قسم"); return; }
    const firstVariation = variations[0];
    const price = parseFloat(firstVariation?.price ?? "0") || 0;
    setSaving(true);
    setSaveError("");
    const { data, error } = await createMenuItem({
      id: crypto.randomUUID(),
      restaurant_id: restaurantId,
      category_id: selectedCat,
      name: name.trim(),
      name_en: null,
      description: description.trim() || null,
      price,
      image: photo,
      is_popular: false,
      is_available: !outOfStock,
      extras: null,
      sort_order: 0,
    });
    setSaving(false);
    if (error || !data) { setSaveError("حدث خطأ أثناء الإضافة، حاول مجدداً"); return; }
    onAdd(data);
    handleClose();
  };

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
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl overflow-y-auto shadow-2xl"
        style={{ maxHeight: "92vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <button className="text-indigo-400 text-sm font-semibold" onClick={handleSubmit}>حفظ</button>
          <h3 className="font-bold text-gray-900 text-base">صنف جديد</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
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

          {/* Error */}
          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl">
              {saveError}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-4 rounded-2xl text-white font-bold text-base mt-2 hover:brightness-110 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)" }}
          >
            {saving ? <><Loader2 className="w-5 h-5 animate-spin" /> جارٍ الإضافة...</> : "إضافة"}
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
  const [dataLoading, setDataLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showAddItem, setShowAddItem] = useState(false);
  const [pendingLang, setPendingLang] = useState<Lang>(lang);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Category creation
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("🍽️");
  const [addingCategory, setAddingCategory] = useState(false);

  // Cover photo
  const coverFileRef = useRef<HTMLInputElement>(null);
  const [coverSaving, setCoverSaving] = useState(false);

  useEffect(() => { setPendingLang(lang); }, [lang]);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setDataLoading(true);
      const rest = await getRestaurantByOwner(user.id);
      setRestaurant(rest);
      if (rest) {
        const [cats, items] = await Promise.all([
          getCategories(rest.id),
          getMenuItems(rest.id),
        ]);
        setCategories(cats);
        setMenuItems(items);
      }
      setDataLoading(false);
    })();
  }, [user?.id]);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleDeleteItem = async (id: string) => {
    await deleteMenuItem(id);
    setMenuItems(prev => prev.filter(i => i.id !== id));
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim() || !restaurant) return;
    setAddingCategory(true);
    const { data } = await createCategory(restaurant.id, newCatName.trim(), newCatIcon);
    setAddingCategory(false);
    if (data) {
      setCategories(prev => [...prev, data as CategoryRow]);
      setNewCatName(""); setNewCatIcon("🍽️"); setShowAddCategory(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant) return;
    setCoverSaving(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      const { data } = await updateRestaurant(restaurant.id, { cover_color: dataUrl });
      if (data) setRestaurant(data);
      setCoverSaving(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = () => {
    setLang(pendingLang);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const planLabel = (plan?: string) =>
    plan === "pro" ? t.planPro : plan === "enterprise" ? t.planEnterprise : t.planFree;

  const primaryStyle = { background: "linear-gradient(135deg, #7c3aed, #6366f1)" };

  if (dataLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  /* ── Shared category creation form ── */
  const CategoryForm = showAddCategory ? (
    <div className="bg-white border border-indigo-100 rounded-3xl p-4 mb-4 shadow-sm">
      <p className="text-sm font-bold text-gray-900 mb-3">إضافة قسم جديد</p>
      <div className="flex gap-1.5 flex-wrap mb-3">
        {["🍽️","🍔","🍕","☕","🥗","🍰","🧃","🍣","🌮","🍜"].map(emoji => (
          <button key={emoji} onClick={() => setNewCatIcon(emoji)}
            className={`w-9 h-9 rounded-xl text-lg transition-all ${newCatIcon === emoji ? "bg-indigo-100 ring-2 ring-indigo-400" : "bg-gray-100 hover:bg-gray-200"}`}>
            {emoji}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input autoFocus value={newCatName} onChange={e => setNewCatName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAddCategory()}
          placeholder="اسم القسم"
          className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        <button onClick={handleAddCategory} disabled={!newCatName.trim() || addingCategory}
          className="px-4 py-2.5 rounded-2xl text-white text-sm font-bold disabled:opacity-50 flex items-center gap-1"
          style={primaryStyle}>
          {addingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> إضافة</>}
        </button>
        <button onClick={() => { setShowAddCategory(false); setNewCatName(""); }}
          className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-white font-sans" dir={dir}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap'); .font-sans { font-family: 'Cairo', sans-serif; } ::-webkit-scrollbar{display:none}`}</style>

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        {/* Left: logo */}
        <img src="/menuclick-logo.jpg" alt="MenuClick" className="h-16 w-auto object-contain rounded-xl" style={{ maxWidth: 160 }} />

        {/* Right: icon buttons */}
        <div className="flex items-center gap-1">
          <button onClick={() => setActiveTab("menu")}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${activeTab === "menu" ? "text-white" : "text-gray-400 hover:bg-gray-100"}`}
            style={activeTab === "menu" ? primaryStyle : {}}>
            <UtensilsCrossed className="w-4 h-4" />
          </button>
          <button onClick={() => setActiveTab("qr")}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${activeTab === "qr" ? "text-white" : "text-gray-400 hover:bg-gray-100"}`}
            style={activeTab === "qr" ? primaryStyle : {}}>
            <QrCode className="w-4 h-4" />
          </button>
          <button onClick={() => setActiveTab("settings")}
            className={`w-9 h-9 rounded-2xl flex items-center justify-center transition-all ${activeTab === "settings" ? "text-white" : "text-gray-400 hover:bg-gray-100"}`}
            style={activeTab === "settings" ? primaryStyle : {}}>
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={handleLogout}
            className="w-9 h-9 rounded-2xl flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-400 transition-all">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Page content ── */}
      <div className="max-w-lg mx-auto px-4 pb-28">

        {/* ══ MENU TAB ══ */}
        {activeTab === "menu" && (
          <>
            {/* Cover photo */}
            <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            <div
              className="relative mt-4 rounded-3xl overflow-hidden cursor-pointer group"
              style={{ height: 220 }}
              onClick={() => coverFileRef.current?.click()}
            >
              {restaurant?.cover_color?.startsWith("data:") ? (
                <img src={restaurant.cover_color} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full"
                  style={{ background: restaurant?.cover_color ?? "linear-gradient(135deg, #e0e7ff, #c7d2fe)" }} />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-2xl px-4 py-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                  {coverSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الرفع...</> : <><Camera className="w-4 h-4" /> تغيير الغلاف</>}
                </div>
              </div>
            </div>

            {/* Category pills */}
            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              <button className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                <Pencil className="w-4 h-4 text-white" />
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                    selectedCategory === cat.id ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}>
                  {cat.icon} {cat.name}
                </button>
              ))}
              <button onClick={() => setShowAddCategory(true)}
                className="flex-shrink-0 flex items-center gap-1 px-4 py-2 rounded-full text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-all"
                style={{ border: "2px dashed #6366f1" }}>
                <Plus className="w-3.5 h-3.5" /> + add category
              </button>
            </div>

            {/* Category form */}
            <div className="mt-3">{CategoryForm}</div>

            {/* Per-category sections */}
            {(selectedCategory === "all" ? categories : categories.filter(c => c.id === selectedCategory)).map(cat => {
              const catItems = menuItems.filter(i => i.category_id === cat.id);
              return (
                <div key={cat.id} className="mt-5">
                  {/* Section header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-black text-gray-900 text-xl">{cat.name}</h3>
                    <button onClick={() => setShowAddItem(true)}
                      className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center hover:bg-gray-700 transition-colors">
                      <Plus className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* 2-col grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {catItems.map(item => (
                      <div key={item.id}
                        className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm group hover:shadow-md transition-all">
                        <div className="relative h-36 bg-gray-100 flex items-center justify-center text-4xl overflow-hidden">
                          {item.image
                            ? <img src={item.image} className="w-full h-full object-cover" />
                            : <span className="text-4xl">🍽️</span>
                          }
                          <button onClick={() => handleDeleteItem(item.id)}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-black text-gray-900">من {item.price} {t.currency}</p>
                          <p className="text-sm text-gray-600 mt-0.5 truncate">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-gray-400 mt-1 truncate">من {item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Dashed add card */}
                    <button onClick={() => setShowAddItem(true)}
                      className="rounded-3xl flex flex-col items-center justify-center gap-2 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-colors"
                      style={{ minHeight: 200, border: "2px dashed #6366f1" }}>
                      <Plus className="w-7 h-7" />
                      <span>add item</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Empty state */}
            {categories.length === 0 && (
              <div className="mt-8 text-center">
                <button onClick={() => setShowAddCategory(true)}
                  className="w-full rounded-3xl flex flex-col items-center justify-center gap-3 py-16 text-indigo-600 font-semibold"
                  style={{ border: "2px dashed #6366f1" }}>
                  <Plus className="w-8 h-8" />
                  <span>أضف قسماً للبدء</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* ══ QR TAB ══ */}
        {activeTab === "qr" && (
          <div className="mt-6 space-y-4">
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-5">
                <h3 className="font-bold text-gray-900 mb-1">{t.restaurantQr}</h3>
                <p className="text-sm text-gray-400 mb-5">{t.restaurantQrDesc}</p>

                <div className="flex items-center justify-center py-10 bg-gray-50 rounded-3xl mb-5">
                  <div className="bg-white p-6 rounded-3xl shadow-md text-center">
                    <QrCode className="w-36 h-36 text-gray-900 mx-auto" />
                    <p className="mt-4 text-sm font-bold text-gray-900">{restaurant?.name ?? "—"}</p>
                    <p className="text-xs text-gray-400 mt-1">{t.scanToView}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={primaryStyle}>
                    <Link2 className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-xs text-gray-500 flex-1 truncate" dir="ltr">
                    {typeof window !== "undefined" ? window.location.origin : ""}/menu/{restaurant?.id ?? "…"}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { const url = `${window.location.origin}/menu/${restaurant?.id}`; navigator.clipboard.writeText(url); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-4 rounded-2xl text-sm hover:bg-gray-800 transition-colors">
                    <Link2 className="w-4 h-4" /> {t.copyLink}
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-4 rounded-2xl text-sm hover:brightness-110 transition-all"
                    style={primaryStyle}>
                    <QrCode className="w-4 h-4" /> {t.downloadQr}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-gray-900 text-sm">حالة المنيو</p>
                <span className="flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> نشط
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={primaryStyle}>
                  <span className="text-white">{restaurant?.logo ?? "🍽️"}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-gray-900 truncate">{restaurant?.name ?? "—"}</p>
                  <p className="text-xs text-gray-400">{menuItems.length} صنف • {categories.length} قسم</p>
                </div>
                <Link href={restaurant ? `/menu/${restaurant.id}` : "#"}>
                  <button className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 px-3 py-2 rounded-xl hover:bg-indigo-50 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> معاينة
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ══ SETTINGS TAB ══ */}
        {activeTab === "settings" && (
          <div className="mt-6 space-y-4">
            <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: "#eef2ff" }}>
                  <Globe className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{t.languageSection}</p>
                  <p className="text-xs text-gray-400">{t.languageDesc}</p>
                </div>
              </div>
              <div className="p-5 space-y-3">
                {(["ar", "en"] as Lang[]).map(l => (
                  <label key={l} onClick={() => setPendingLang(l)}
                    className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${pendingLang === l ? "border-indigo-500 bg-indigo-50" : "border-gray-100 hover:border-gray-200"}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{l === "ar" ? "🇸🇦" : "🇺🇸"}</span>
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{l === "ar" ? t.arabic : t.english}</p>
                        <p className="text-xs text-gray-400">{l === "ar" ? "RTL — من اليمين لليسار" : "LTR — Left to right"}</p>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${pendingLang === l ? "border-indigo-500 bg-indigo-500" : "border-gray-300"}`}>
                      {pendingLang === l && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </label>
                ))}
              </div>
              <div className="px-5 pb-5">
                <button onClick={handleSaveSettings}
                  className="w-full text-white font-bold py-3.5 rounded-2xl hover:brightness-110 transition-all"
                  style={primaryStyle}>
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
                  { label: lang === "ar" ? "عدد الأصناف" : "Items", value: String(menuItems.length) },
                  { label: lang === "ar" ? "عدد الأقسام" : "Categories", value: String(categories.length) },
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

      {/* ── Floating preview button (peach/orange like reference) ── */}
      {activeTab === "menu" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <Link href={restaurant ? `/menu/${restaurant.id}` : "#"}>
            <button className="flex items-center gap-2.5 font-bold text-sm px-6 py-3.5 rounded-full shadow-xl hover:shadow-2xl transition-all"
              style={{ background: "#ffe8d4", color: "#c2440b" }}>
              <Eye className="w-4 h-4" />
              preview
            </button>
          </Link>
        </div>
      )}

      {/* ── Item Modal ── */}
      <ItemModal
        open={showAddItem}
        onClose={() => setShowAddItem(false)}
        categories={categories}
        restaurantId={restaurant?.id ?? ""}
        onAdd={(item) => setMenuItems(prev => [...prev, item])}
      />
    </div>
  );
}
