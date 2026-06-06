import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "ar" | "en";

const translations = {
  ar: {
    // Sidebar
    appName: "منيو باركود",
    overview: "نظرة عامة",
    menuMgmt: "إدارة المنيو",
    qrCodes: "أكواد QR",
    orders: "الطلبات",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    previewMenu: "معاينة المنيو",
    // Plans
    planFree: "مجاني",
    planPro: "احترافي",
    planEnterprise: "مؤسسي",
    // Header
    welcome: "مرحباً",
    notifications: "الإشعارات",
    newOrder: "طلب جديد — طاولة",
    items: "أصناف",
    // Overview
    totalOrdersToday: "إجمالي الطلبات اليوم",
    revenueToday: "الإيرادات اليوم",
    avgOrderValue: "متوسط قيمة الطلب",
    activeTables: "الطاولات النشطة",
    recentOrders: "آخر الطلبات",
    viewAll: "عرض الكل",
    topItems: "الأصناف الأكثر طلباً",
    table: "طاولة",
    // Menu
    categories: "الأقسام",
    newCategory: "قسم جديد",
    all: "الكل",
    addItem: "إضافة صنف",
    itemsCount: "صنف",
    addNewItem: "إضافة صنف جديد",
    itemName: "اسم الصنف",
    itemNamePlaceholder: "مثال: دجاج مشوي",
    description: "الوصف",
    descriptionPlaceholder: "وصف مختصر للصنف...",
    price: "السعر",
    currency: "ر.س",
    section: "القسم",
    cancel: "إلغاء",
    add: "إضافة الصنف",
    popular: "رائج",
    // QR
    restaurantQr: "كود QR للمطعم كاملاً",
    restaurantQrDesc: "يفتح المنيو العام بدون تحديد طاولة",
    downloadQr: "تحميل QR",
    scanToView: "امسح لعرض المنيو",
    tableQrs: "أكواد QR للطاولات",
    downloadAll: "تحميل الكل",
    tableLabel: "طاولة",
    downloadPng: "تحميل PNG",
    copyLink: "نسخ الرابط",
    link: "رابط",
    // Orders
    statusAll: "الكل",
    startPrep: "بدء التحضير",
    readyToDeliver: "جاهز للتسليم",
    delivered: "تم التسليم",
    total: "الإجمالي",
    tableNo: "طاولة رقم",
    // Status labels
    pending: "انتظار",
    preparing: "يُحضَّر",
    ready: "جاهز",
    deliveredStatus: "سُلِّم",
    // Settings
    settingsTitle: "إعدادات لوحة التحكم",
    languageSection: "اللغة والمنطقة",
    languageDesc: "اختر لغة عرض لوحة التحكم",
    arabic: "العربية",
    english: "English",
    saveSettings: "حفظ الإعدادات",
    settingsSaved: "✓ تم حفظ الإعدادات",
    appearanceSection: "المظهر",
    restaurantInfo: "بيانات المطعم",
    restaurantInfoDesc: "تعديل اسم المطعم والشعار والألوان",
    editInfo: "تعديل البيانات",
  },
  en: {
    // Sidebar
    appName: "QR Menu",
    overview: "Overview",
    menuMgmt: "Menu Management",
    qrCodes: "QR Codes",
    orders: "Orders",
    settings: "Settings",
    logout: "Logout",
    previewMenu: "Preview Menu",
    // Plans
    planFree: "Free",
    planPro: "Pro",
    planEnterprise: "Enterprise",
    // Header
    welcome: "Welcome",
    notifications: "Notifications",
    newOrder: "New order — Table",
    items: "items",
    // Overview
    totalOrdersToday: "Total Orders Today",
    revenueToday: "Today's Revenue",
    avgOrderValue: "Average Order Value",
    activeTables: "Active Tables",
    recentOrders: "Recent Orders",
    viewAll: "View All",
    topItems: "Top Selling Items",
    table: "Table",
    // Menu
    categories: "Categories",
    newCategory: "New Category",
    all: "All",
    addItem: "Add Item",
    itemsCount: "items",
    addNewItem: "Add New Item",
    itemName: "Item Name",
    itemNamePlaceholder: "e.g. Grilled Chicken",
    description: "Description",
    descriptionPlaceholder: "Brief description...",
    price: "Price",
    currency: "SAR",
    section: "Category",
    cancel: "Cancel",
    add: "Add Item",
    popular: "Popular",
    // QR
    restaurantQr: "Restaurant QR Code",
    restaurantQrDesc: "Opens the full menu without specifying a table",
    downloadQr: "Download QR",
    scanToView: "Scan to view menu",
    tableQrs: "Table QR Codes",
    downloadAll: "Download All",
    tableLabel: "Table",
    downloadPng: "Download PNG",
    copyLink: "Copy Link",
    link: "Link",
    // Orders
    statusAll: "All",
    startPrep: "Start Preparing",
    readyToDeliver: "Ready to Deliver",
    delivered: "Mark Delivered",
    total: "Total",
    tableNo: "Table No.",
    // Status labels
    pending: "Pending",
    preparing: "Preparing",
    ready: "Ready",
    deliveredStatus: "Delivered",
    // Settings
    settingsTitle: "Dashboard Settings",
    languageSection: "Language & Region",
    languageDesc: "Choose your preferred dashboard language",
    arabic: "العربية",
    english: "English",
    saveSettings: "Save Settings",
    settingsSaved: "✓ Settings saved",
    appearanceSection: "Appearance",
    restaurantInfo: "Restaurant Info",
    restaurantInfoDesc: "Edit restaurant name, logo and colors",
    editInfo: "Edit Info",
  },
} as const;

export type TranslationKey = keyof typeof translations.ar;
export type Translations = typeof translations.ar;

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
  dir: "rtl" | "ltr";
}

const LangContext = createContext<LangContextType | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("qrmenu_lang") as Lang) ?? "ar";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("qrmenu_lang", l);
  };

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] as Translations, dir }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
