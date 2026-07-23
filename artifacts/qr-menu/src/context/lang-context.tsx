import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "ar" | "en";

const translations = {
  ar: {
    // Sidebar / App
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
    // Menu / Categories
    categories: "الأقسام",
    newCategory: "+ قسم جديد",
    all: "الكل",
    addItem: "إضافة صنف",
    itemsCount: "صنف",
    addNewItem: "إضافة صنف جديد",
    itemName: "اسم الصنف",
    itemNamePlaceholder: "مثال: دجاج مشوي",
    description: "الوصف",
    descriptionPlaceholder: "وصف شهي جداً...",
    price: "السعر",
    currency: "ر.س",
    section: "القسم",
    cancel: "إلغاء",
    add: "إضافة",
    popular: "رائج",
    // Item Modal
    save: "حفظ",
    newItem: "صنف جديد",
    editItem: "تعديل الصنف",
    saving: "جارٍ الحفظ...",
    adding: "جارٍ الإضافة...",
    saveChanges: "حفظ التعديلات",
    deleteItem: "حذف الصنف",
    confirmDeleteLabel: "تأكيد الحذف",
    addItemError: "حدث خطأ أثناء الإضافة، حاول مجدداً",
    saveItemError: "حدث خطأ أثناء الحفظ، حاول مجدداً",
    itemNameRequired: "يرجى إدخال اسم الصنف",
    categoryRequired: "يرجى اختيار قسم",
    hideFromMenu: "إخفاء من المنيو",
    hideFromMenuDesc: "سيظهر الصنف لك فقط",
    outOfStock: "غير متوفر",
    outOfStockDesc: "سيرى الضيوف أنه سيكون متاحاً لاحقاً",
    addVariation: "+ إضافة حجم / خيار",
    addPhoto: "أضف\nصورة",
    quantity: "الكمية",
    grams: "غرام",
    mlUnit: "مل",
    smallPlaceholder: "صغير",
    largePlaceholder: "كبير",
    fromPrice: "من",
    addItemCard: "أضف صنفاً",
    // Category form
    addNewCategoryTitle: "إضافة قسم جديد",
    categoryNamePlaceholder: "اسم القسم",
    addCategoryToStart: "أضف قسماً للبدء",
    // Cover
    changeCover: "تغيير الغلاف",
    uploadingCover: "جارٍ الرفع...",
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
    menuStatus: "حالة المنيو",
    active: "نشط",
    categoriesCountLabel: "قسم",
    previewBtn: "معاينة",
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
    currencySection: "العملة",
    currencyDesc: "اختر عملة عرض الأسعار في المنيو",
    currencyUpdated: "✓ تم تحديث العملة",
    nameLabel: "الاسم",
    planLabelKey: "الباقة",
    itemsLabel: "عدد الأصناف",
    categoriesLabel: "عدد الأقسام",
    // Font
    fontFamily: "'Cairo', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap",
  },
  en: {
    // Sidebar / App
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
    // Menu / Categories
    categories: "Categories",
    newCategory: "+ New Category",
    all: "All",
    addItem: "Add Item",
    itemsCount: "items",
    addNewItem: "Add New Item",
    itemName: "Item Name",
    itemNamePlaceholder: "e.g. Grilled Chicken",
    description: "Description",
    descriptionPlaceholder: "A delicious description...",
    price: "Price",
    currency: "SAR",
    section: "Category",
    cancel: "Cancel",
    add: "Add",
    popular: "Popular",
    // Item Modal
    save: "Save",
    newItem: "New Item",
    editItem: "Edit Item",
    saving: "Saving...",
    adding: "Adding...",
    saveChanges: "Save Changes",
    deleteItem: "Delete Item",
    confirmDeleteLabel: "Confirm Delete",
    addItemError: "Failed to add item, please try again",
    saveItemError: "Failed to save item, please try again",
    itemNameRequired: "Please enter item name",
    categoryRequired: "Please select a category",
    hideFromMenu: "Hide from Menu",
    hideFromMenuDesc: "Only visible to you",
    outOfStock: "Out of Stock",
    outOfStockDesc: "Guests will see it as coming soon",
    addVariation: "+ Add Size / Option",
    addPhoto: "Add\nPhoto",
    quantity: "Amount",
    grams: "g",
    mlUnit: "ml",
    smallPlaceholder: "Small",
    largePlaceholder: "Large",
    fromPrice: "From",
    addItemCard: "Add Item",
    // Category form
    addNewCategoryTitle: "Add New Category",
    categoryNamePlaceholder: "Category name",
    addCategoryToStart: "Add a category to get started",
    // Cover
    changeCover: "Change Cover",
    uploadingCover: "Uploading...",
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
    menuStatus: "Menu Status",
    active: "Active",
    categoriesCountLabel: "categories",
    previewBtn: "Preview",
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
    currencySection: "Currency",
    currencyDesc: "Choose the currency shown for menu prices",
    currencyUpdated: "✓ Currency updated",
    nameLabel: "Name",
    planLabelKey: "Plan",
    itemsLabel: "Items",
    categoriesLabel: "Categories",
    // Font
    fontFamily: "'Inter', sans-serif",
    fontUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
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
