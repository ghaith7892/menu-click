export type OrderStatus = "pending" | "preparing" | "ready" | "delivered";

export interface MenuItem {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  popular?: boolean;
  extras?: { name: string; price: number }[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  restaurantId: string;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: { item: MenuItem; quantity: number; extras?: string[] }[];
  status: OrderStatus;
  total: number;
  createdAt: string;
  restaurantId: string;
}

export interface Restaurant {
  id: string;
  name: string;
  nameEn: string;
  logo: string;
  coverColor: string;
  description: string;
  owner: string;
  plan: "free" | "pro" | "enterprise";
  tables: number;
  createdAt: string;
  isActive: boolean;
}

export const MOCK_RESTAURANT: Restaurant = {
  id: "rest-1",
  name: "مطعم النخبة",
  nameEn: "Al Nakhba Restaurant",
  logo: "🍽️",
  coverColor: "#7c3aed",
  description: "أفضل المأكولات العربية والشرقية",
  owner: "أحمد الزهراني",
  plan: "pro",
  tables: 12,
  createdAt: "2024-01-15",
  isActive: true,
};

export const MOCK_CATEGORIES: Category[] = [
  { id: "cat-1", name: "المشويات", icon: "🔥", restaurantId: "rest-1" },
  { id: "cat-2", name: "المقبلات", icon: "🥗", restaurantId: "rest-1" },
  { id: "cat-3", name: "المشروبات", icon: "🥤", restaurantId: "rest-1" },
  { id: "cat-4", name: "الحلويات", icon: "🍮", restaurantId: "rest-1" },
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
  {
    id: "item-1",
    name: "دجاج مشوي مع الأرز",
    description: "دجاج طازج متبل ومشوي على الفحم، يقدم مع أرز بالأعشاب وصوص الثوم",
    price: 45,
    image: "🍗",
    categoryId: "cat-1",
    popular: true,
    extras: [
      { name: "صوص حار إضافي", price: 3 },
      { name: "خبز إضافي", price: 5 },
      { name: "سلطة", price: 8 },
    ],
  },
  {
    id: "item-2",
    name: "كباب لحم",
    description: "كباب لحم بقري طازج متبل بالبهارات الشرقية، يقدم مع البروغل والطحينية",
    price: 55,
    image: "🥩",
    categoryId: "cat-1",
    popular: true,
    extras: [
      { name: "بصل محمر", price: 4 },
      { name: "طحينية إضافية", price: 3 },
    ],
  },
  {
    id: "item-3",
    name: "سيخ الدجاج",
    description: "قطع دجاج طرية على السيخ مع الفلفل والبصل والطماطم",
    price: 38,
    image: "🍢",
    categoryId: "cat-1",
  },
  {
    id: "item-4",
    name: "حمص بالطحينة",
    description: "حمص طازج مطحون مع الطحينة وعصير الليمون وزيت الزيتون",
    price: 18,
    image: "🫘",
    categoryId: "cat-2",
    popular: true,
  },
  {
    id: "item-5",
    name: "فتوش",
    description: "سلطة فتوش طازجة بالخضار والخبز المقرمش وتتبيلة الرمان",
    price: 22,
    image: "🥗",
    categoryId: "cat-2",
  },
  {
    id: "item-6",
    name: "متبل الباذنجان",
    description: "باذنجان مشوي مهروس مع الطحينة والثوم والليمون",
    price: 20,
    image: "🍆",
    categoryId: "cat-2",
  },
  {
    id: "item-7",
    name: "عصير ليمون بالنعناع",
    description: "عصير ليمون طازج بالنعناع والسكر المثلج",
    price: 15,
    image: "🍋",
    categoryId: "cat-3",
    popular: true,
  },
  {
    id: "item-8",
    name: "ماء معدني",
    description: "زجاجة ماء معدني باردة 500ml",
    price: 5,
    image: "💧",
    categoryId: "cat-3",
  },
  {
    id: "item-9",
    name: "شاي بالنعناع",
    description: "شاي مغربي أصيل بالنعناع الطازج",
    price: 12,
    image: "🍵",
    categoryId: "cat-3",
  },
  {
    id: "item-10",
    name: "أم علي",
    description: "حلوى أم علي الشرقية بالعجين والقشطة والمكسرات",
    price: 25,
    image: "🍮",
    categoryId: "cat-4",
    popular: true,
  },
  {
    id: "item-11",
    name: "كنافة",
    description: "كنافة نابلسية بالجبن والقطر والفستق",
    price: 28,
    image: "🧆",
    categoryId: "cat-4",
  },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: "ord-1",
    tableNumber: 3,
    items: [
      { item: MOCK_MENU_ITEMS[0], quantity: 2 },
      { item: MOCK_MENU_ITEMS[3], quantity: 1 },
      { item: MOCK_MENU_ITEMS[6], quantity: 2 },
    ],
    status: "preparing",
    total: 128,
    createdAt: "2025-06-05T10:15:00",
    restaurantId: "rest-1",
  },
  {
    id: "ord-2",
    tableNumber: 7,
    items: [
      { item: MOCK_MENU_ITEMS[1], quantity: 1 },
      { item: MOCK_MENU_ITEMS[4], quantity: 1 },
    ],
    status: "pending",
    total: 77,
    createdAt: "2025-06-05T10:22:00",
    restaurantId: "rest-1",
  },
  {
    id: "ord-3",
    tableNumber: 1,
    items: [
      { item: MOCK_MENU_ITEMS[2], quantity: 3 },
      { item: MOCK_MENU_ITEMS[7], quantity: 3 },
      { item: MOCK_MENU_ITEMS[9], quantity: 2 },
    ],
    status: "ready",
    total: 174,
    createdAt: "2025-06-05T09:58:00",
    restaurantId: "rest-1",
  },
  {
    id: "ord-4",
    tableNumber: 5,
    items: [
      { item: MOCK_MENU_ITEMS[0], quantity: 1 },
      { item: MOCK_MENU_ITEMS[10], quantity: 1 },
      { item: MOCK_MENU_ITEMS[8], quantity: 2 },
    ],
    status: "delivered",
    total: 98,
    createdAt: "2025-06-05T09:40:00",
    restaurantId: "rest-1",
  },
];

export const MOCK_ADMIN_RESTAURANTS: Restaurant[] = [
  MOCK_RESTAURANT,
  {
    id: "rest-2",
    name: "كافيه بريق",
    nameEn: "Bareeq Cafe",
    logo: "☕",
    coverColor: "#7c3aed",
    description: "كافيه عصري بأجواء مريحة",
    owner: "سارة القحطاني",
    plan: "pro",
    tables: 8,
    createdAt: "2024-02-20",
    isActive: true,
  },
  {
    id: "rest-3",
    name: "بيتزا ريا",
    nameEn: "Pizza Ria",
    logo: "🍕",
    coverColor: "#dc2626",
    description: "بيتزا إيطالية أصيلة",
    owner: "خالد العمري",
    plan: "free",
    tables: 6,
    createdAt: "2024-03-10",
    isActive: true,
  },
  {
    id: "rest-4",
    name: "سوشي هاوس",
    nameEn: "Sushi House",
    logo: "🍣",
    coverColor: "#0891b2",
    description: "أفضل المأكولات اليابانية",
    owner: "نورة الفهد",
    plan: "enterprise",
    tables: 20,
    createdAt: "2024-04-05",
    isActive: true,
  },
  {
    id: "rest-5",
    name: "برغر تاون",
    nameEn: "Burger Town",
    logo: "🍔",
    coverColor: "#d97706",
    description: "برغر أمريكي أصيل",
    owner: "فيصل الدوسري",
    plan: "pro",
    tables: 10,
    createdAt: "2024-05-12",
    isActive: false,
  },
];
