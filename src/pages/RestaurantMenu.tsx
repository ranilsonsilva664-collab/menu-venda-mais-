import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  Leaf,
  WheatOff,
  Flame,
  MilkOff,
  NutOff,
  Search,
  SlidersHorizontal,
  Plus,
  Minus,
  X,
  ShoppingBag,
  Sparkles,
  Clock,
  ChefHat,
  Heart,
  Check,
  ChevronRight,
  ChevronLeft,
  Lock,
  Edit2,
  Trash2,
  Upload,
  LogOut,
  ImagePlus,
  ImageIcon,
  Star,
  MessageCircle,
  Tag,
  Phone,
  Palette,
  Settings,
  Calendar,
  MapPin,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { cn } from "../utils/cn";
import { compressImage } from "../utils/imageCompressor";

type Dietary = "vegan" | "vegetarian" | "glutenFree" | "dairyFree" | "nutFree" | "spicy";

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  dietary: Dietary[];
  calories?: number;
  prepTime?: string;
  popular?: boolean;
  chefPick?: boolean;
};

type CartItem = {
  id: string;
  menuId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  notes?: string;
  options?: string[];
};

export type Transaction = {
  id: string;
  type: "entry" | "exit";
  description: string;
  value: number;
  date: string;
};

const dietaryMeta: Record<Dietary, { label: string; icon: React.ComponentType<any>; color: string }> = {
  vegan: { label: "Vegano", icon: Leaf, color: "text-emerald-600 bg-emerald-50 ring-emerald-200" },
  vegetarian: { label: "Vegetariano", icon: Leaf, color: "text-green-600 bg-green-50 ring-green-200" },
  glutenFree: { label: "Sem Glúten", icon: WheatOff, color: "text-amber-600 bg-amber-50 ring-amber-200" },
  dairyFree: { label: "Sem Lactose", icon: MilkOff, color: "text-sky-600 bg-sky-50 ring-sky-200" },
  nutFree: { label: "Sem Nozes", icon: NutOff, color: "text-orange-600 bg-orange-50 ring-orange-200" },
  spicy: { label: "Picante", icon: Flame, color: "text-red-600 bg-red-50 ring-red-200" },
};

const PLACEHOLDER = "https://images.pexels.com/photos/6327536/pexels-photo-6327536.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200";

export const INITIAL_MENU: MenuItem[] = [
  {
    id: "m1",
    name: "Polvo Grelhado",
    description: "Páprica defumada, batatinhas, salsa verde, azeite de limão",
    price: 18,
    category: "Entradas",
    images: [
      "https://images.pexels.com/photos/24289165/pexels-photo-24289165.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/6327536/pexels-photo-6327536.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/1327393/pexels-photo-1327393.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["glutenFree", "dairyFree", "nutFree"],
    calories: 320,
    prepTime: "12 min",
    chefPick: true,
  },
  {
    id: "m2",
    name: "Burrata com Tomates",
    description: "Azeite de manjericão, vinagre balsâmico envelhecido, pão sourdough",
    price: 16,
    category: "Entradas",
    images: [
      "https://images.pexels.com/photos/6327536/pexels-photo-6327536.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/28448379/pexels-photo-28448379.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/5156929/pexels-photo-5156929.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["vegetarian", "nutFree"],
    calories: 380,
    prepTime: "8 min",
    popular: true,
  },
  {
    id: "m3",
    name: "Lula Crocante",
    description: "Aioli de pimenta calabresa, limão preservado, ervas",
    price: 17,
    category: "Entradas",
    images: [
      "https://images.pexels.com/photos/7627408/pexels-photo-7627408.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/24289165/pexels-photo-24289165.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["nutFree", "spicy"],
    calories: 420,
    prepTime: "10 min",
  },
  {
    id: "m4",
    name: "Caesar Suprema",
    description: "Alface romana, anchova branca, pecorino, crocante de pão",
    price: 15,
    category: "Saladas",
    images: [
      "https://images.pexels.com/photos/30700808/pexels-photo-30700808.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/4669306/pexels-photo-4669306.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/6763224/pexels-photo-6763224.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["nutFree"],
    calories: 340,
    prepTime: "7 min",
    popular: true,
  },
  {
    id: "m5",
    name: "Beterraba Assada com Cítricos",
    description: "Queijo de cabra batido, pistache, vinagrete de xerez",
    price: 16,
    category: "Saladas",
    images: [
      "https://images.pexels.com/photos/4669306/pexels-photo-4669306.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/30700808/pexels-photo-30700808.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["vegetarian", "glutenFree"],
    calories: 290,
    prepTime: "9 min",
  },
  {
    id: "m6",
    name: "Ribeye Seco 400g",
    description: "Manteiga de tutano, cebolinha grelhada, agrião",
    price: 48,
    category: "Principais",
    images: [
      "https://images.pexels.com/photos/36430157/pexels-photo-36430157.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/1327393/pexels-photo-1327393.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/5156929/pexels-photo-5156929.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["glutenFree", "nutFree"],
    calories: 820,
    prepTime: "22 min",
    chefPick: true,
  },
  {
    id: "m7",
    name: "Salmão Grelhado",
    description: "Lentilhas beluga, crème fraîche de endro, pepino",
    price: 34,
    category: "Principais",
    images: [
      "https://images.pexels.com/photos/1327393/pexels-photo-1327393.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/7627408/pexels-photo-7627408.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/36430157/pexels-photo-36430157.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["glutenFree", "nutFree"],
    calories: 560,
    prepTime: "18 min",
    popular: true,
  },
  {
    id: "m8",
    name: "Hambúrguer Trufado",
    description: "Dois hambúrgueres, queijo comté, aioli de trufa, brioche",
    price: 24,
    category: "Principais",
    images: [
      "https://images.pexels.com/photos/4315148/pexels-photo-4315148.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/5488052/pexels-photo-5488052.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/33253821/pexels-photo-33253821.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["nutFree"],
    calories: 980,
    prepTime: "14 min",
    popular: true,
  },
  {
    id: "m9",
    name: "Pappardelle de Cogumelos",
    description: "Trufa negra, parmigiano reggiano, tomilho",
    price: 28,
    category: "Massas e Risotos",
    images: [
      "https://images.pexels.com/photos/7491886/pexels-photo-7491886.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/2773940/pexels-photo-2773940.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/16594961/pexels-photo-16594961.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["vegetarian", "nutFree"],
    calories: 640,
    prepTime: "16 min",
    chefPick: true,
  },
  {
    id: "m10",
    name: "Ravioli de Lagosta",
    description: "Bisque de açafrão, estragão, raspas de limão",
    price: 36,
    category: "Massas e Risotos",
    images: [
      "https://images.pexels.com/photos/2773940/pexels-photo-2773940.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/7491886/pexels-photo-7491886.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/8194817/pexels-photo-8194817.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["nutFree"],
    calories: 710,
    prepTime: "17 min",
  },
  {
    id: "m11",
    name: "Risoto Cacio e Pepe",
    description: "Pimenta preta tostada, pecorino, azeite",
    price: 26,
    category: "Massas e Risotos",
    images: [
      "https://images.pexels.com/photos/8194817/pexels-photo-8194817.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/7491886/pexels-photo-7491886.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["vegetarian", "nutFree", "glutenFree"],
    calories: 590,
    prepTime: "20 min",
  },
  {
    id: "m12",
    name: "Margherita D.O.P.",
    description: "San Marzano, fior di latte, manjericão, azeite extra virgem",
    price: 19,
    category: "Pizza",
    images: [
      "https://images.pexels.com/photos/31596394/pexels-photo-31596394.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/19260730/pexels-photo-19260730.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/5280912/pexels-photo-5280912.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["vegetarian", "nutFree"],
    calories: 850,
    prepTime: "12 min",
    popular: true,
  },
  {
    id: "m13",
    name: "Pizza Soppressata Picante",
    description: "Mel picante, stracciatella, azeite de pimenta",
    price: 23,
    category: "Pizza",
    images: [
      "https://images.pexels.com/photos/19260730/pexels-photo-19260730.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/31596394/pexels-photo-31596394.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["nutFree", "spicy"],
    calories: 920,
    prepTime: "13 min",
  },
  {
    id: "m14",
    name: "Bolo de Chocolate Lava",
    description: "Gelato de baunilha, sal marinho de Maldon",
    price: 14,
    category: "Sobremesas",
    images: [
      "https://images.pexels.com/photos/11653574/pexels-photo-11653574.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/10480244/pexels-photo-10480244.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/33674405/pexels-photo-33674405.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["vegetarian", "nutFree"],
    calories: 520,
    prepTime: "10 min",
    popular: true,
  },
  {
    id: "m15",
    name: "Tiramisù de Pistache",
    description: "Café expresso, mascarpone, cacau",
    price: 13,
    category: "Sobremesas",
    images: [
      "https://images.pexels.com/photos/10480244/pexels-photo-10480244.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/11653574/pexels-photo-11653574.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["vegetarian"],
    calories: 480,
    prepTime: "5 min",
    chefPick: true,
  },
  {
    id: "m16",
    name: "Spritz de Yuzu",
    description: "Gin, yuzu, espumante, tomilho",
    price: 15,
    category: "Bebidas",
    images: [
      "https://images.pexels.com/photos/7627408/pexels-photo-7627408.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
      "https://images.pexels.com/photos/6327536/pexels-photo-6327536.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    ],
    dietary: ["vegan", "glutenFree", "dairyFree", "nutFree"],
    calories: 180,
    prepTime: "4 min",
  },
];

export default function RestaurantMenu() {
  const { tenantId } = useParams();
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [query, setQuery] = useState("");
  const [dietaryFilters, setDietaryFilters] = useState<Dietary[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(["m7", "m12"]);
  const [toast, setToast] = useState<string | null>(null);

  // Admin states
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [tenantPassword, setTenantPassword] = useState("savore2026");
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [newItem, setNewItem] = useState<Partial<MenuItem>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showHeroEditor, setShowHeroEditor] = useState(false);
  const [showPromoEditor, setShowPromoEditor] = useState(false);
  const [showWhatsAppEditor, setShowWhatsAppEditor] = useState(false);
  const [showReviewsEditor, setShowReviewsEditor] = useState(false);
  const [showFinanceEditor, setShowFinanceEditor] = useState(false);

  // Finance states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({ type: "entry" });
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Checkout (WhatsApp)
  const [showCheckout, setShowCheckout] = useState(false);
  const [customer, setCustomer] = useState({ name: "", address: "", notes: "" });

  // Store configuration
  const [whatsappNumber, setWhatsappNumber] = useState("5511999998888"); // formato internacional: 55 + DDD + número
  const [restaurantName, setRestaurantName] = useState("Restaurante");
  const [headerSubtitle, setHeaderSubtitle] = useState("");
  const [headerLogo, setHeaderLogo] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [storeType, setStoreType] = useState<"delivery" | "appointment">("delivery");
  const [locationAddress, setLocationAddress] = useState("");
  const [showLocationMap, setShowLocationMap] = useState(false);

  // Theme configuration
  const [themeColor, setThemeColor] = useState("#f59e0b");
  const [themeFont, setThemeFont] = useState("Plus Jakarta Sans");
  const [themeSubtitleFont, setThemeSubtitleFont] = useState("Plus Jakarta Sans");
  const [themeBgColor, setThemeBgColor] = useState("#faf7f2");
  const [themeTextColor, setThemeTextColor] = useState("#18181b");

  // Music configuration
  const hasAttemptedAutoplay = useRef(false);

  // Promo banner state
  const [promoBanner, setPromoBanner] = useState({
    enabled: true,
    title: "Promoção de Hoje",
    description: "Polvo Grelhado + taça de vinho da casa por um preço imperdível, somente hoje!",
    image: "https://images.pexels.com/photos/24289165/pexels-photo-24289165.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1200",
    oldPrice: 32.0,
    newPrice: 22.9,
    buttonText: "Pedir Agora",
    productName: "Polvo Grelhado + Taça de Vinho",
  });

  // Reviews / Avaliações
  const [reviews, setReviews] = useState({
    rating: 4.9,
    totalReviews: 1287,
    totalOrders: 1287,
    recommendation: 98,
    text: "dos clientes recomendam",
  });

  // Gallery state
  const [galleryIndex, setGalleryIndex] = useState(0);

  // Closed Alert Modal
  const [showClosedAlert, setShowClosedAlert] = useState(false);

  // Global brand / hero state
  const [heroImage, setHeroImage] = useState<string>(
    "https://images.pexels.com/photos/3933217/pexels-photo-3933217.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1600"
  );
  const [heroTitle, setHeroTitle] = useState("Feito com fogo & ingredientes nobres");
  const [heroSubtitle, setHeroSubtitle] = useState(
    "Massas artesanais, pizzas no forno a lenha e crudo do litoral. Monte sua refeição perfeita com recomendações para restrições alimentares e toques do chef."
  );
  const [heroBadge, setHeroBadge] = useState("Cardápio da estação • Inverno 2026");

  const HERO_SUGGESTIONS = [
    "https://images.pexels.com/photos/3933217/pexels-photo-3933217.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1600",
    "https://images.pexels.com/photos/28448379/pexels-photo-28448379.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1600",
    "https://images.pexels.com/photos/1327393/pexels-photo-1327393.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1600",
    "https://images.pexels.com/photos/36430157/pexels-photo-36430157.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1600",
    "https://images.pexels.com/photos/7491886/pexels-photo-7491886.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1600",
    "https://images.pexels.com/photos/31596394/pexels-photo-31596394.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1600",
  ];

  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

  const dynamicCategories = useMemo(() => {
    return Array.from(new Set(menu.map((item) => item.category)));
  }, [menu]);

  const CATEGORIES = ["Todos", ...dynamicCategories];

  const filtered = useMemo(() => {
    return menu.filter((item) => {
      const matchesCat = activeCategory === "Todos" || item.category === activeCategory;
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase());
      const matchesDietary =
        dietaryFilters.length === 0 || dietaryFilters.every((d) => item.dietary.includes(d));
      return matchesCat && matchesQuery && matchesDietary;
    });
  }, [menu, activeCategory, query, dietaryFilters]);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of filtered) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = subtotal * 0.0875;
  const tip = subtotal * 0.18;
  const total = subtotal + tax + tip;
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    if (!tenantId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const restDoc = await getDoc(doc(db, "restaurants", tenantId));
        if (restDoc.exists()) {
          const data = restDoc.data();
          setRestaurantName(data.name || "Restaurante");
          document.title = `${data.name || "Restaurante"} • Menu Digital`;
          setWhatsappNumber(data.whatsappNumber || "");
          setHeaderSubtitle(data.headerSubtitle || "");
          setHeaderLogo(data.headerLogo || "");
          if (data.heroImage) setHeroImage(data.heroImage);
          if (data.heroTitle) setHeroTitle(data.heroTitle);
          if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
          if (data.heroBadge) setHeroBadge(data.heroBadge);
          if (data.headerLogo) setHeaderLogo(data.headerLogo);
          if (data.themeColor) {
            setThemeColor(data.themeColor);
          } else {
            setThemeColor("#f59e0b");
          }
          if (data.themeFont) setThemeFont(data.themeFont);
          if (data.themeSubtitleFont) setThemeSubtitleFont(data.themeSubtitleFont);
          if (data.themeBgColor) setThemeBgColor(data.themeBgColor);
          if (data.themeTextColor) setThemeTextColor(data.themeTextColor);
          if (data.promoBanner) setPromoBanner(data.promoBanner);
          if (data.adminPassword) setTenantPassword(data.adminPassword); // we use it for checking
          if (data.openTime) setOpenTime(data.openTime);
          if (data.closeTime) setCloseTime(data.closeTime);
          if (data.storeType) setStoreType(data.storeType);
          if (data.locationAddress) setLocationAddress(data.locationAddress);
          if (data.showLocationMap !== undefined) setShowLocationMap(data.showLocationMap);
        } else {
          // If restaurant not found, maybe show a 404 or default
          console.warn("Restaurant not found");
        }

        // Fetch menu
        const menuRef = collection(db, "restaurants", tenantId, "menu");
        const menuSnap = await getDocs(menuRef);
        const items = menuSnap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem));
        
        // Se estiver vazio, popula com os de exemplo só para testes (ou poderia deixar vazio)
        setMenu(items.length > 0 ? items : INITIAL_MENU);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tenantId]);

  // Fetch transactions when admin logs in
  useEffect(() => {
    if (!isAdmin || !tenantId) return;
    const fetchTransactions = async () => {
      setLoadingTransactions(true);
      try {
        const transRef = collection(db, "restaurants", tenantId, "transactions");
        const transSnap = await getDocs(transRef);
        const fetched = transSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
        // Sort by date descending
        fetched.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(fetched);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTransactions(false);
      }
    };
    fetchTransactions();
  }, [isAdmin, tenantId]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Reset gallery when opening a different item
  useEffect(() => { setGalleryIndex(0); }, [selectedItem]);

  // Public functions
  const addToCart = (item: MenuItem, opts?: { notes?: string; options?: string[] }) => {
    if (!isStoreOpen()) {
      setShowClosedAlert(true);
      return;
    }
    setCart((prev) => {
      const key = item.id + (opts?.options?.join("|") ?? "") + (opts?.notes ?? "");
      const existing = prev.find((p) => p.id === key);
      if (existing) {
        return prev.map((p) => (p.id === key ? { ...p, quantity: p.quantity + 1 } : p));
      }
      return [
        ...prev,
        {
          id: key,
          menuId: item.id,
          name: item.name,
          price: item.price,
          image: item.images[0] || PLACEHOLDER,
          quantity: 1,
          notes: opts?.notes,
          options: opts?.options,
        },
      ];
    });
    setToast(`${item.name} adicionado ao ${storeType === "appointment" ? "agendamento" : "pedido"}!`);
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const toggleFav = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const scrollToCategory = (cat: string) => {
    setActiveCategory(cat);
    if (cat !== "Todos") {
      categoryRefs.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Admin functions
  const handleAdminLogin = () => {
    if (adminPassword === tenantPassword) {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setShowAdminPanel(true);
      setAdminPassword("");
      setToast("Acesso de administrador concedido");
    } else {
      setToast("Senha incorreta");
    }
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    setShowAdminPanel(false);
    setEditingItem(null);
    setShowAddForm(false);
    setToast("Sessão de admin encerrada");
  };

  const handleSingleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "add" | "edit"
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    let loaded = 0;

    const finish = () => {
      if (target === "add") {
        setNewItem((prev) => {
          const existing = prev.images || [];
          const merged = [...existing, ...newImages].slice(0, 10);
          return { ...prev, images: merged };
        });
      } else if (editingItem) {
        setEditingItem((prev) => {
          if (!prev) return prev;
          const merged = [...prev.images, ...newImages].slice(0, 10);
          return { ...prev, images: merged };
        });
      }
    };

    for (let i = 0; i < files.length; i++) {
      compressImage(files[i], 800, 0.5).then((base64) => {
        newImages.push(base64);
        loaded++;
        if (loaded === files.length) finish();
      }).catch((err) => {
        console.error("Erro ao comprimir imagem:", err);
        setToast("Erro ao processar imagem");
      });
    }
  };

  const removeImage = (idx: number, target: "add" | "edit") => {
    if (target === "add") {
      setNewItem((prev) => {
        const imgs = (prev.images || []).filter((_, i) => i !== idx);
        return { ...prev, images: imgs };
      });
    } else if (editingItem) {
      setEditingItem((prev) => {
        if (!prev) return prev;
        return { ...prev, images: prev.images.filter((_, i) => i !== idx) };
      });
    }
  };

  const setAsCover = (idx: number, target: "add" | "edit") => {
    if (idx === 0) return;
    if (target === "add") {
      setNewItem((prev) => {
        const imgs = [...(prev.images || [])];
        const [picked] = imgs.splice(idx, 1);
        imgs.unshift(picked);
        return { ...prev, images: imgs };
      });
    } else if (editingItem) {
      setEditingItem((prev) => {
        if (!prev) return prev;
        const imgs = [...prev.images];
        const [picked] = imgs.splice(idx, 1);
        imgs.unshift(picked);
        return { ...prev, images: imgs };
      });
    }
  };

  // === WhatsApp / Checkout ===
  const formatCurrency = (v: number) => `R$${v.toFixed(2).replace(".", ",")}`;

  const buildWhatsAppMessage = (
    items: { name: string; quantity: number; price: number; notes?: string }[],
    info: { name: string; address: string; notes: string },
    grandTotal: number
  ) => {
    const lines: string[] = [];
    lines.push(`Olá! Vim pelo ${storeType === "appointment" ? "catálogo" : "menu"} digital do *${restaurantName}* e gostaria de fazer um ${storeType === "appointment" ? "agendamento" : "pedido"}:`);
    lines.push("");

    items.forEach((it, i) => {
      lines.push(`*${i + 1}. ${it.name}*`);
      lines.push(`Quantidade: ${it.quantity}`);
      lines.push(`Valor unitário: ${formatCurrency(it.price)}`);
      lines.push(`Subtotal: ${formatCurrency(it.price * it.quantity)}`);
      if (it.notes) lines.push(`Obs: ${it.notes}`);
      lines.push("");
    });

    lines.push("―――――――――――――");
    lines.push(`Nome: ${info.name || "(não informado)"}`);
    if (storeType === "appointment") {
      let displayDate = info.address || "(não informado)";
      if (displayDate && displayDate.includes("T")) {
        const [d, t] = displayDate.split("T");
        const [yyyy, mm, dd] = d.split("-");
        displayDate = `${dd}/${mm}/${yyyy} às ${t}`;
      }
      lines.push(`Data/Hora: ${displayDate}`);
    } else {
      lines.push(`Endereço: ${info.address || "(retirar no local)"}`);
    }
    if (info.notes) lines.push(`Observação: ${info.notes}`);
    lines.push("―――――――――――――");
    lines.push(`*TOTAL: ${formatCurrency(grandTotal)}*`);

    return lines.join("\n");
  };

  const sendWhatsApp = (
    items: { name: string; quantity: number; price: number; notes?: string }[],
    info: { name: string; address: string; notes: string },
    grandTotal: number
  ) => {
    const message = buildWhatsAppMessage(items, info, grandTotal);
    const phone = whatsappNumber.replace(/\D/g, "");
    if (!phone) {
      setToast("Configure o número do WhatsApp no painel admin");
      return;
    }

    if (tenantId) {
      try {
        const tId = "t" + Date.now();
        const t: Transaction = {
          id: tId,
          type: "entry",
          description: `Pedido: ${info.name || "Cliente"}`,
          value: grandTotal,
          date: new Date().toISOString()
        };
        const docRef = doc(db, "restaurants", tenantId, "transactions", tId);
        
        // Execute background write without awaiting so browser doesn't block window.open
        setDoc(docRef, t).catch(err => console.error("Failed to save automatic transaction", err));
        
        if (isAdmin) {
          setTransactions(prev => [t, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
      } catch (err) {
        console.error(err);
      }
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const isStoreOpen = () => {
    if (!openTime || !closeTime) return true;
    
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    
    const [openH, openM] = openTime.split(':').map(Number);
    const openTotalMinutes = openH * 60 + openM;
    
    const [closeH, closeM] = closeTime.split(':').map(Number);
    let closeTotalMinutes = closeH * 60 + closeM;
    
    // Handle case where store closes after midnight (e.g. 18:00 to 02:00)
    if (closeTotalMinutes < openTotalMinutes) {
      if (currentTotalMinutes >= openTotalMinutes || currentTotalMinutes <= closeTotalMinutes) {
        return true;
      }
      return false;
    }
    
    return currentTotalMinutes >= openTotalMinutes && currentTotalMinutes <= closeTotalMinutes;
  };

  const openCheckout = () => {
    if (!isStoreOpen()) {
      setShowClosedAlert(true);
      return;
    }
    if (cart.length === 0) {
      setToast(`Adicione itens ao ${storeType === "appointment" ? "agendamento" : "pedido"} primeiro`);
      return;
    }
    setShowCheckout(true);
    setShowCart(false);
  };

  const submitCheckout = () => {
    if (!customer.name.trim()) {
      setToast("Por favor, informe seu nome");
      return;
    }
    const items = cart.map((c) => ({ name: c.name, quantity: c.quantity, price: c.price, notes: c.notes }));
    sendWhatsApp(items, customer, subtotal);
    setShowCheckout(false);
    setCart([]);
    setCustomer({ name: "", address: "", notes: "" });
    setToast("Enviado para o WhatsApp!");
  };

  const orderPromoNow = () => {
    setShowCheckout(true);
    // If user wants to pre-fill cart with the promo item, we just send directly:
    const promoItem = {
      name: promoBanner.productName,
      quantity: 1,
      price: promoBanner.newPrice,
    };
    // Pre-populate empty checkout; user fills name then submits and we send only the promo
    setCart([
      {
        id: "promo-" + Date.now(),
        menuId: "promo",
        name: promoBanner.productName,
        price: promoBanner.newPrice,
        image: promoBanner.image,
        quantity: 1,
      },
    ]);
    setToast(`${promoItem.name} adicionado ao pedido — preencha seus dados`);
  };

  const saveEditedItem = async () => {
    if (!editingItem || !tenantId) return;
    if (editingItem.images.length === 0) {
      setToast("É necessário pelo menos uma imagem");
      return;
    }
    setMenu((prev) => prev.map((item) => (item.id === editingItem.id ? editingItem : item)));
    try {
      await setDoc(doc(db, "restaurants", tenantId, "menu", editingItem.id), editingItem);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar produto: " + e.message);
    }
    setEditingItem(null);
    setToast("Item atualizado com sucesso");
  };

  const deleteItem = async (id: string) => {
    if (!tenantId) return;
    if (!confirm("Tem certeza que deseja remover este item?")) return;
    setMenu((prev) => prev.filter((item) => item.id !== id));
    try {
      await deleteDoc(doc(db, "restaurants", tenantId, "menu", id));
    } catch (e) {
      console.error(e);
    }
    setToast("Item removido");
  };

  const addNewItem = async () => {
    if (!tenantId) return;
    if (!newItem.name || !newItem.description || !newItem.price) {
      setToast("Preencha nome, descrição e preço");
      return;
    }
    const images = newItem.images && newItem.images.length > 0 ? newItem.images : [PLACEHOLDER];

    const item: MenuItem = {
      id: "m" + Date.now(),
      name: newItem.name,
      description: newItem.description,
      price: newItem.price,
      category: newItem.category || "Entradas",
      images,
      dietary: newItem.dietary || [],
      popular: newItem.popular || false,
      chefPick: newItem.chefPick || false,
    };
    if (newItem.calories) item.calories = newItem.calories;
    if (newItem.prepTime) item.prepTime = newItem.prepTime;

    setMenu((prev) => [...prev, item]);
    try {
      await setDoc(doc(db, "restaurants", tenantId, "menu", item.id), item);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao adicionar produto: " + e.message);
    }
    setNewItem({});
    setShowAddForm(false);
    setToast("Novo item adicionado ao cardápio");
  };

  const toggleDietary = (diet: Dietary, target: "edit" | "new") => {
    if (target === "edit" && editingItem) {
      const current = editingItem.dietary;
      const updated = current.includes(diet)
        ? current.filter((d) => d !== diet)
        : [...current, diet];
      setEditingItem({ ...editingItem, dietary: updated });
    } else {
      const current = newItem.dietary || [];
      const updated = current.includes(diet)
        ? current.filter((d) => d !== diet)
        : [...current, diet];
      setNewItem({ ...newItem, dietary: updated });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="size-8 border-4 border-zinc-200 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-[var(--theme-text-color)]" style={{ backgroundColor: themeBgColor, '--theme-text-color': themeTextColor, '--theme-color': themeColor, '--theme-font': `"${themeFont}", system-ui, sans-serif`, '--theme-subtitle-font': `"${themeSubtitleFont}", system-ui, sans-serif` } as React.CSSProperties}>
      <style>{`
        :root { 
          font-family: var(--theme-font); 
        }
        body { font-family: var(--theme-font); }
        .display { font-family: var(--theme-font); font-weight: 700; letter-spacing: -0.02em; }
        .subtitle-font { font-family: var(--theme-subtitle-font); }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-thumb { background: #e7dccb; border-radius: 999px; border: 2px solid #faf7f2; }
        ::-webkit-scrollbar-thumb:hover { background: #d9cbb5; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#faf7f2]/80 border-b border-zinc-200/70">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {headerLogo ? (
                <img src={headerLogo} className="size-10 rounded-2xl object-cover shadow-lg" alt="Logo" />
              ) : (
                <div className="size-10 rounded-2xl bg-gradient-to-br from-[var(--theme-color)] to-black flex items-center justify-center shadow-lg text-white font-bold text-xl">
                  {(restaurantName || "R").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="leading-tight select-none flex flex-col justify-center" onDoubleClick={() => setShowAdminLogin(true)}>
                <div className="flex items-center gap-2">
                  <div className="display text-[22px] tracking-tight">{restaurantName || "Restaurante"}</div>
                  {isStoreOpen() ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold tracking-widest uppercase mt-0.5 border border-emerald-200">
                      Aberto
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold tracking-widest uppercase mt-0.5 border border-red-200">
                      Fechado
                    </span>
                  )}
                </div>
                {headerSubtitle && <div className="text-[11px] uppercase tracking-widest text-zinc-500 font-medium">{headerSubtitle}</div>}
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 flex-1 max-w-xl mx-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Busque produtos, categorias..."
                  className="w-full h-10 pl-9 pr-3 rounded-full bg-white border border-zinc-200 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)]/30 focus:border-[var(--theme-color)] transition"
                />
              </div>
              <button
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  "h-10 px-3 rounded-full border text-sm font-medium flex items-center gap-1.5 transition",
                  showFilters || dietaryFilters.length > 0
                    ? "bg-[var(--theme-color)] text-white border-[var(--theme-color)]"
                    : "bg-white border-zinc-200 hover:bg-zinc-50"
                )}
              >
                <SlidersHorizontal className="size-4" />
                Filtros
                {dietaryFilters.length > 0 && (
                  <span className="ml-1 size-5 grid place-items-center rounded-full bg-[var(--theme-color)] text-[11px] text-white">
                    {dietaryFilters.length}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="h-9 px-3 rounded-full bg-emerald-600 text-white text-sm font-medium flex items-center gap-1.5 hover:bg-emerald-700"
                  >
                    <Edit2 className="size-4" /> Editar Cardápio
                  </button>
                  <button
                    onClick={() => logoutAdmin()}
                    className="h-9 px-3 rounded-full border border-zinc-300 text-sm font-medium flex items-center gap-1.5 hover:bg-white"
                  >
                    <LogOut className="size-4" /> Sair
                  </button>
                </>
              )}
              <button
                onClick={() => setShowCart(true)}
                className="relative h-10 pl-3 pr-4 rounded-full bg-[var(--theme-color)] text-white text-sm font-medium flex items-center gap-2 transition hover:opacity-90"
              >
                {storeType === "appointment" ? <Calendar className="size-4" /> : <ShoppingBag className="size-4" />}
                <span className="hidden sm:inline">{storeType === "appointment" ? "Agendamentos" : "Pedido"}</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 grid place-items-center rounded-full bg-[var(--theme-color)] text-[11px] font-bold border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile search */}
          <div className="md:hidden pb-3 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar no menu..."
                className="w-full h-10 pl-9 pr-3 rounded-full bg-white border border-zinc-200 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--theme-color)]/30"
              />
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="h-10 aspect-square grid place-items-center rounded-full bg-white border border-zinc-200"
            >
              <SlidersHorizontal className="size-4" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="border-t border-zinc-200/70 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap gap-2">
              {Object.entries(dietaryMeta).map(([key, meta]) => {
                const active = dietaryFilters.includes(key as Dietary);
                const Icon = meta.icon;
                return (
                  <button
                    key={key}
                    onClick={() =>
                      setDietaryFilters((prev) =>
                        active ? prev.filter((d) => d !== key) : [...prev, key as Dietary]
                      )
                    }
                    className={cn(
                      "h-8 px-3 rounded-full border text-xs font-medium flex items-center gap-1.5 transition",
                      active
                        ? "bg-[var(--theme-color)] text-white border-[var(--theme-color)]"
                        : "bg-white border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    <Icon className="size-3.5" />
                    {meta.label}
                  </button>
                );
              })}
              {dietaryFilters.length > 0 && (
                <button
                  onClick={() => setDietaryFilters([])}
                  className="h-8 px-3 rounded-full text-xs font-medium text-zinc-600 hover:text-zinc-900"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="flex items-center justify-end gap-2 mb-4">
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowWhatsAppEditor(true)}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-white border border-zinc-200 text-xs font-medium hover:bg-zinc-50 shadow-sm text-[var(--theme-color)]"
                >
                  <Palette className="size-3.5" /> Cores e Aparência
                </button>
                <button
                  onClick={() => setShowHeroEditor(true)}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-white border border-zinc-200 text-xs font-medium hover:bg-zinc-50 shadow-sm"
                >
                  <Edit2 className="size-3.5" /> Editar Capa e Título
                </button>
              </>
            )}
          </div>
          <div className="flex flex-col gap-8">
            <div className="max-w-2xl">

              <h1 className="display text-[48px] sm:text-[64px] leading-[0.9] tracking-tight whitespace-pre-line">
                {heroTitle}
              </h1>
              <p className="mt-4 text-zinc-600 text-[15px] leading-relaxed subtitle-font">{heroSubtitle}</p>
            </div>
            
            <div className="relative w-full">
              <div className="aspect-[16/9] md:aspect-[21/9] rounded-[2rem] overflow-hidden shadow-2xl shadow-amber-900/10 ring-1 ring-black/5">
                <img src={heroImage} alt="Destaque do chef" className="w-full h-full object-cover" />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {CATEGORIES.slice(1, 6).map((cat) => (
                <button
                  key={cat}
                  onClick={() => scrollToCategory(cat)}
                  className="group h-9 px-4 rounded-full bg-white border border-zinc-200 text-sm font-medium hover:border-zinc-300 hover:shadow-sm transition flex items-center gap-1"
                >
                  {cat}
                  <ChevronRight className="size-3.5 opacity-60 group-hover:translate-x-0.5 transition" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Category tabs */}
      <div className="sticky top-[64px] z-30 bg-[#faf7f2]/90 backdrop-blur border-y border-zinc-200/70">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => scrollToCategory(cat)}
                className={cn(
                  "whitespace-nowrap h-9 px-4 rounded-full text-sm font-medium transition border",
                  activeCategory === cat
                    ? "bg-[var(--theme-color)] text-white border-[var(--theme-color)]"
                    : "bg-white border-zinc-200 hover:border-zinc-300"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* PROMO BANNER */}
      {promoBanner.enabled && (
        <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[var(--theme-color)] to-black shadow-2xl">
            {isAdmin && (
              <button
                onClick={() => setShowPromoEditor(true)}
                className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 h-9 rounded-full bg-white text-zinc-900 text-xs font-semibold hover:bg-zinc-100 shadow-lg"
              >
                <Edit2 className="size-3.5" /> Editar Promoção
              </button>
            )}
            <div className="grid md:grid-cols-2 items-center">
              <div className="p-8 sm:p-10 lg:p-12 text-white">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur text-[11px] font-bold uppercase tracking-widest mb-4">
                  <Tag className="size-3.5" /> Oferta Especial
                </div>
                <h2 className="display text-3xl sm:text-4xl lg:text-5xl leading-[0.95] mb-3 break-words">{promoBanner.title}</h2>
                <p className="text-white/90 text-sm sm:text-[15px] leading-relaxed max-w-md mb-6">
                  {promoBanner.description}
                </p>
                <div className="flex flex-wrap items-end gap-2 sm:gap-4 mb-6">
                  <div className="text-white/70 text-base sm:text-lg line-through">
                    {formatCurrency(promoBanner.oldPrice)}
                  </div>
                  <div className="text-white text-4xl sm:text-5xl font-bold display leading-none">
                    {formatCurrency(promoBanner.newPrice)}
                  </div>
                  <div className="text-white/90 text-xs font-bold pb-1 sm:pb-2">
                    {promoBanner.oldPrice > 0 &&
                      `-${Math.round(((promoBanner.oldPrice - promoBanner.newPrice) / promoBanner.oldPrice) * 100)}%`}
                  </div>
                </div>
                <button
                  onClick={orderPromoNow}
                  className="group inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white text-zinc-900 font-bold hover:bg-zinc-100 transition shadow-xl active:scale-95"
                >
                  <MessageCircle className="size-5 text-emerald-600" />
                  {promoBanner.buttonText}
                  <ChevronRight className="size-4 group-hover:translate-x-1 transition" />
                </button>
              </div>
              <div className="relative h-64 md:h-full min-h-[260px]">
                <img
                  src={promoBanner.image}
                  alt={promoBanner.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-rose-600/60 via-transparent to-transparent md:from-transparent md:via-transparent" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* REVIEWS / TRUST BAR */}
      <section className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-white border border-zinc-200 shadow-sm rounded-3xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-8 text-center sm:text-left">
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-1 text-[var(--theme-color)] mb-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="size-4 fill-current" />
                ))}
              </div>
              <div className="text-3xl font-bold tabular-nums text-zinc-900 tracking-tighter">
                {reviews.rating}
                <span className="text-xl font-medium text-zinc-400">/5</span>
              </div>
            </div>

            <div className="h-9 w-px bg-zinc-200 hidden sm:block" />

            <div className="text-left">
              <div className="text-2xl font-semibold tabular-nums tracking-tighter text-zinc-900">
                {reviews.totalOrders.toLocaleString("pt-BR")}
              </div>
              <div className="text-xs text-zinc-500 font-medium -mt-0.5">pedidos realizados</div>
            </div>
          </div>

          <div className="text-center sm:text-right">
            <div className="inline-flex items-center justify-center gap-1 text-emerald-600 font-bold text-xl">
              {reviews.recommendation}%
            </div>
            <div className="text-xs text-emerald-700 font-medium">{reviews.text}</div>
          </div>

          <div className="text-xs px-4 py-1.5 bg-zinc-100 rounded-full text-zinc-600 font-medium hidden md:block">
            Baseado em {reviews.totalReviews.toLocaleString("pt-BR")} avaliações verificadas
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowReviewsEditor(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-full hover:bg-zinc-50 font-medium"
            >
              <Edit2 className="size-3.5" /> Editar Avaliações
            </button>
          )}
        </div>
      </section>

      {/* Main Menu Content */}
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-[1fr_380px] gap-10 items-start">
        <div className="min-w-0">
          {grouped.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200">
              <div className="text-2xl display">Nenhum produto encontrado</div>
              <p className="text-zinc-600 mt-2">Tente ajustar os filtros ou a busca</p>
            </div>
          ) : (
            <div className="space-y-14">
              {grouped.map(([cat, items]) => (
                <section key={cat} ref={(el) => { categoryRefs.current[cat] = el; }}>
                  <div className="flex items-baseline justify-between mb-5">
                    <h2 className="display text-[32px]">{cat}</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {items.map((item) => (
                      <article
                        key={item.id}
                        className="group relative bg-white rounded-[1.5rem] border border-zinc-200 overflow-hidden hover:shadow-xl hover:shadow-zinc-200/60 hover:-translate-y-0.5 transition-all duration-300"
                      >
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="absolute inset-0 z-10"
                          aria-label={`Ver ${item.name}`}
                        />
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <img
                            src={item.images[0] || PLACEHOLDER}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                            loading="lazy"
                          />
                          {item.images.length > 1 && (
                            <div className="absolute bottom-12 right-3 bg-black/60 backdrop-blur text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <ImagePlus className="size-3" />
                              {item.images.length}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-transparent" />

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFav(item.id);
                            }}
                            className="absolute top-3 right-3 z-20 size-8 grid place-items-center rounded-full bg-white/90 backdrop-blur hover:bg-white transition"
                          >
                            <Heart
                              className={cn(
                                "size-4 transition",
                                favorites.includes(item.id)
                                  ? "fill-red-500 text-red-500"
                                  : "text-zinc-700"
                              )}
                            />
                          </button>
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                            <div className="flex gap-1.5">
                              {item.dietary.slice(0, 3).map((d) => {
                                const meta = dietaryMeta[d];
                                const Icon = meta.icon;
                                return (
                                  <span
                                    key={d}
                                    title={meta.label}
                                    className={cn(
                                      "size-7 grid place-items-center rounded-full ring-1 backdrop-blur",
                                      meta.color
                                    )}
                                  >
                                    <Icon className="size-3.5" />
                                  </span>
                                );
                              })}
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur text-sm font-semibold">
                              R${item.price}
                            </span>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold leading-snug text-[17px]">{item.name}</h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(item);
                              }}
                              className="relative z-20 size-8 grid place-items-center rounded-full bg-zinc-900 text-white hover:bg-zinc-800 active:scale-95 transition"
                            >
                              <Plus className="size-4" />
                            </button>
                          </div>
                          <p className="mt-1 text-sm text-zinc-600 line-clamp-2 leading-relaxed subtitle-font">
                            {item.description}
                          </p>
                          {(item.prepTime || item.calories) && (
                            <div className="mt-3 flex items-center gap-3 text-[12px] text-zinc-500">
                              {item.prepTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3.5" /> {item.prepTime}
                                </span>
                              )}
                              {item.prepTime && item.calories && <span>•</span>}
                              {item.calories && <span>{item.calories} cal</span>}
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}


        {/* Location Map */}
        {showLocationMap && locationAddress && (
          <div className="mt-8 mb-4">
            <h3 className="display text-2xl mb-4 px-4 sm:px-0 flex items-center gap-2">
              <MapPin className="size-6 text-[var(--theme-color)]" />
              Localização
            </h3>
            <div className="w-full h-64 sm:h-80 rounded-3xl overflow-hidden border-2 border-zinc-200 shadow-sm relative z-0">
              <iframe
                className="w-full h-full"
                src={`https://www.google.com/maps?q=${encodeURIComponent(locationAddress)}&output=embed`}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        )}
        </div>

        {/* Order Sidebar */}
        <aside className="hidden lg:block sticky top-[128px]">
          <div className="bg-white rounded-[1.75rem] border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-zinc-200">
              <div className="flex items-center justify-between">
                <h2 className="display text-2xl">{storeType === "appointment" ? "Seu Agendamento" : "Seu Pedido"}</h2>
                <span className="text-xs px-2 py-1 rounded-full bg-zinc-100 font-medium">{cartCount} itens</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1">Refeição no local • Mesa 12</p>
            </div>

            <div className="max-h-[420px] overflow-y-auto divide-y divide-zinc-100">
              {cart.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="size-12 mx-auto rounded-2xl bg-zinc-100 grid place-items-center mb-3">
                    {storeType === "appointment" ? <Calendar className="size-5 text-zinc-400" /> : <ShoppingBag className="size-5 text-zinc-400" />}
                  </div>
                  <div className="font-medium">{storeType === "appointment" ? "Nenhum serviço selecionado" : "Seu pedido está vazio"}</div>
                  <p className="text-sm text-zinc-600 mt-1">{storeType === "appointment" ? "Selecione serviços para agendar" : "Adicione itens para começar"}</p>
                </div>
              ) : (
                cart.map((ci) => (
                  <div key={ci.id} className="p-4 flex gap-3">
                    <img src={ci.image} alt="" className="size-16 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium leading-tight pr-2">{ci.name}</div>
                        <button
                          onClick={() => setCart((prev) => prev.filter((p) => p.id !== ci.id))}
                          className="text-zinc-400 hover:text-zinc-700"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      {ci.notes && (
                        <div className="text-[11px] italic text-[var(--theme-color)] opacity-80 mt-0.5">"{ci.notes}"</div>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQty(ci.id, -1)}
                            className="size-7 grid place-items-center rounded-full border border-zinc-200 hover:bg-zinc-50"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{ci.quantity}</span>
                          <button
                            onClick={() => updateQty(ci.id, 1)}
                            className="size-7 grid place-items-center rounded-full border border-zinc-200 hover:bg-zinc-50"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                        <div className="text-sm font-semibold">
                          R${(ci.price * ci.quantity).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <>
                <div className="p-5 space-y-2 text-sm border-t border-zinc-200 bg-zinc-50/50">
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Subtotal</span>
                    <span className="font-medium">R${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Impostos</span>
                    <span className="font-medium">R${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600">Gorjeta (18%)</span>
                    <span className="font-medium">R${tip.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base pt-2 border-t border-zinc-200">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">R${total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="p-5 pt-0">
                  <button
                    onClick={openCheckout}
                    className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 active:scale-[0.99] transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="size-4" /> Finalizar pelo WhatsApp
                  </button>
                  <p className="text-[10px] text-zinc-500 text-center mt-2">
                    Você será direcionado ao WhatsApp do restaurante
                  </p>
                </div>
              </>
            )}
          </div>
        </aside>
      </main>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm">
            <div className="flex justify-center mb-4">
              <div className="size-14 bg-zinc-900 rounded-2xl grid place-items-center">
                <Lock className="size-7 text-white" />
              </div>
            </div>
            <h3 className="text-center text-2xl font-semibold mb-2">Acesso Administrativo</h3>
            <p className="text-center text-sm text-zinc-600 mb-6">Digite a senha para editar o cardápio</p>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Senha"
              className="w-full border border-zinc-200 rounded-xl px-4 h-12 mb-4"
              onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
            />
            <div className="flex gap-3">
              <button onClick={() => setShowAdminLogin(false)} className="flex-1 h-11 rounded-xl border">
                Cancelar
              </button>
              <button onClick={handleAdminLogin} className="flex-1 h-11 rounded-xl bg-zinc-900 text-white">
                Entrar
              </button>
            </div>
            <p className="text-center text-[10px] text-zinc-400 mt-4">Senha de demonstração: savore2026</p>
          </div>
        </div>
      )}

      {/* Hero Editor Modal */}
      {showHeroEditor && isAdmin && (
        <div className="fixed inset-0 z-[180] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="text-xl font-semibold">Editar Capa e Título</div>
              <button onClick={() => setShowHeroEditor(false)}>
                <X />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-5">
              <div>
                <label className="text-sm font-medium mb-2 block">Tag (selo laranja)</label>
                <input
                  value={heroBadge}
                  onChange={(e) => setHeroBadge(e.target.value)}
                  className="w-full border h-11 rounded-xl px-4"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Título principal <span className="text-xs text-zinc-500">(use uma nova linha com Enter para quebrar)</span>
                </label>
                <textarea
                  value={heroTitle}
                  onChange={(e) => setHeroTitle(e.target.value)}
                  rows={2}
                  className="w-full border rounded-xl p-4 text-lg font-semibold"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Subtítulo / descrição</label>
                <textarea
                  value={heroSubtitle}
                  onChange={(e) => setHeroSubtitle(e.target.value)}
                  rows={3}
                  className="w-full border rounded-xl p-4"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Imagem da Capa</label>
                <div className="aspect-[16/9] rounded-2xl overflow-hidden border-2 border-dashed border-zinc-300 bg-zinc-50">
                  <img src={heroImage} className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <label className="cursor-pointer flex items-center gap-2 px-4 h-10 border rounded-xl text-sm hover:bg-zinc-50">
                    <Upload className="size-4" /> Fazer upload de imagem
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const compressed = await compressImage(file, 1000, 0.6);
                          setHeroImage(compressed);
                        } catch (err) {
                          console.error(err);
                          setToast("Erro ao processar imagem da capa");
                        }
                      }}
                    />
                  </label>
                  <div className="text-xs text-zinc-500">ou escolha uma sugestão abaixo:</div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
                  {HERO_SUGGESTIONS.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setHeroImage(src)}
                      className={cn(
                        "aspect-square rounded-xl overflow-hidden border-2 transition",
                        heroImage === src ? "border-amber-500" : "border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      <img src={src} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button
                onClick={() => setShowHeroEditor(false)}
                className="px-5 h-11 rounded-2xl border"
              >
                Fechar
              </button>
              <button
                onClick={async () => {
                  if (tenantId) {
                    try {
                      await setDoc(doc(db, "restaurants", tenantId), {
                        heroImage,
                        heroTitle,
                        heroSubtitle,
                        heroBadge
                      }, { merge: true });
                      setToast("Capa e título atualizados!");
                    } catch (e: any) {
                      console.error(e);
                      alert("Erro ao salvar configurações da capa: " + e.message);
                      setToast("Erro ao salvar.");
                    }
                  }
                  setShowHeroEditor(false);
                }}
                className="px-5 h-11 rounded-2xl bg-zinc-900 text-white"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROMO EDITOR */}
      {showPromoEditor && isAdmin && (
        <div className="fixed inset-0 z-[180] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl max-h-[92vh] rounded-3xl flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-rose-100 rounded-xl grid place-items-center">
                  <Tag className="size-5 text-rose-600" />
                </div>
                <div>
                  <div className="text-xl font-semibold">Banner de Promoção</div>
                  <div className="text-sm text-zinc-500">Edite a oferta destacada no topo do cardápio</div>
                </div>
              </div>
              <button onClick={() => setShowPromoEditor(false)}><X /></button>
            </div>
            <div className="flex-1 overflow-auto p-6 space-y-5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={promoBanner.enabled}
                  onChange={(e) => setPromoBanner({ ...promoBanner, enabled: e.target.checked })}
                  className="size-5 rounded"
                />
                <span className="font-medium">Exibir banner promocional no cardápio</span>
              </label>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Título</label>
                  <input
                    value={promoBanner.title}
                    onChange={(e) => setPromoBanner({ ...promoBanner, title: e.target.value })}
                    className="w-full border h-11 rounded-xl px-4"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Nome do produto (para o WhatsApp)</label>
                  <input
                    value={promoBanner.productName}
                    onChange={(e) => setPromoBanner({ ...promoBanner, productName: e.target.value })}
                    className="w-full border h-11 rounded-xl px-4"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Descrição</label>
                <textarea
                  value={promoBanner.description}
                  onChange={(e) => setPromoBanner({ ...promoBanner, description: e.target.value })}
                  rows={2}
                  className="w-full border rounded-xl p-3"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Preço antigo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={promoBanner.oldPrice}
                    onChange={(e) =>
                      setPromoBanner({ ...promoBanner, oldPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full border h-11 rounded-xl px-4"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Preço promocional (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={promoBanner.newPrice}
                    onChange={(e) =>
                      setPromoBanner({ ...promoBanner, newPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full border h-11 rounded-xl px-4"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Texto do botão</label>
                  <input
                    value={promoBanner.buttonText}
                    onChange={(e) => setPromoBanner({ ...promoBanner, buttonText: e.target.value })}
                    className="w-full border h-11 rounded-xl px-4"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Imagem do banner</label>
                <div className="aspect-[16/9] rounded-2xl overflow-hidden border bg-zinc-50 mb-3">
                  <img src={promoBanner.image} className="w-full h-full object-cover" />
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 h-10 border rounded-xl text-sm hover:bg-zinc-50">
                  <Upload className="size-4" /> Fazer upload de imagem
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const compressed = await compressImage(file, 1000, 0.6);
                        setPromoBanner({ ...promoBanner, image: compressed });
                      } catch (err) {
                        console.error(err);
                        setToast("Erro ao processar imagem da promoção");
                      }
                    }}
                  />
                </label>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-4 text-xs text-zinc-600">
                <strong>Ação do botão:</strong> ao clicar em "{promoBanner.buttonText}", o produto será
                adicionado ao pedido e o cliente será levado para finalizar via WhatsApp.
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => setShowPromoEditor(false)} className="px-5 h-11 rounded-2xl border">
                Fechar
              </button>
              <button
                onClick={async () => {
                  if (tenantId) {
                    try {
                      await setDoc(doc(db, "restaurants", tenantId), {
                        promoBanner
                      }, { merge: true });
                      setToast("Banner promocional atualizado!");
                    } catch (e: any) {
                      console.error(e);
                      alert("Erro ao salvar banner promocional: " + e.message);
                      setToast("Erro ao salvar.");
                    }
                  }
                  setShowPromoEditor(false);
                }}
                className="px-5 h-11 rounded-2xl bg-zinc-900 text-white"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP CONFIG */}
      {showWhatsAppEditor && isAdmin && (
        <div className="fixed inset-0 z-[180] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-emerald-100 rounded-xl grid place-items-center">
                  <Settings className="size-5 text-emerald-700" />
                </div>
                <div className="text-xl font-semibold">Configurações da Loja</div>
              </div>
              <button onClick={() => setShowWhatsAppEditor(false)}><X /></button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="text-sm font-medium mb-2 block">Tipo de Negócio</label>
                <div className="flex gap-2">
                  <label className={cn("flex-1 cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 text-sm font-medium transition", storeType === "delivery" ? "border-emerald-500 bg-emerald-50/50 text-emerald-700" : "hover:bg-zinc-50")}>
                    <input type="radio" name="storeType" className="hidden" checked={storeType === "delivery"} onChange={() => setStoreType("delivery")} />
                    <ShoppingBag className="size-5" />
                    Delivery / Produtos
                  </label>
                  <label className={cn("flex-1 cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-2 text-sm font-medium transition", storeType === "appointment" ? "border-emerald-500 bg-emerald-50/50 text-emerald-700" : "hover:bg-zinc-50")}>
                    <input type="radio" name="storeType" className="hidden" checked={storeType === "appointment"} onChange={() => setStoreType("appointment")} />
                    <Calendar className="size-5" />
                    Serviços / Agendamento
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Nome do Negócio</label>
                <input
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full border h-11 rounded-xl px-4"
                />
                <p className="text-xs text-zinc-500 mt-1">Aparece no início da mensagem</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Número do WhatsApp (formato internacional)
                </label>
                <input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="5511999998888"
                  className="w-full border h-11 rounded-xl px-4 font-mono"
                />
                <p className="text-xs text-zinc-500 mt-2">
                  Inclua o código do país (55 = Brasil) + DDD + número. Apenas dígitos. <br />
                  Exemplo: <code className="bg-zinc-100 px-1 rounded">5511987654321</code>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Horário de Abertura</label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full border h-11 rounded-xl px-4"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Horário de Fechamento</label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full border h-11 rounded-xl px-4"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between -mt-2">
                <p className="text-xs text-zinc-500">
                  Deixe ambos em branco para funcionamento 24h.
                </p>
                {(openTime || closeTime) && (
                  <button 
                    onClick={() => {
                      setOpenTime("");
                      setCloseTime("");
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Limpar (24h)
                  </button>
                )}
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Subtítulo do Cabeçalho</label>
                <input
                  value={headerSubtitle}
                  onChange={(e) => setHeaderSubtitle(e.target.value)}
                  className="w-full border h-11 rounded-xl px-4"
                  placeholder="Ex: Barber Shop"
                />
                <p className="text-xs text-zinc-500 mt-1">Deixe em branco para ocultar. Ex: "Menu Digital" ou "Catálogo"</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Logo (Opcional)</label>
                <div className="flex items-center gap-3 mt-2">
                  <label className="cursor-pointer px-4 h-10 border rounded-xl text-sm flex items-center gap-2 hover:bg-zinc-50">
                    <Upload className="size-4" /> Carregar Logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const compressed = await compressImage(file, 400, 0.6);
                          setHeaderLogo(compressed);
                        } catch (err) {
                          setToast("Erro ao carregar logo");
                        }
                      }}
                    />
                  </label>
                  {headerLogo ? (
                    <div className="relative group">
                       <img src={headerLogo} className="size-10 rounded-xl object-cover shadow border" />
                       <button onClick={() => setHeaderLogo("")} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"><X className="size-3" /></button>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-400">Nenhum logo</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Cor Principal</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="size-11 rounded-xl cursor-pointer border-0 p-0 overflow-hidden"
                    />
                    <div className="text-xs text-zinc-500 flex-1 leading-tight">
                      Cor dos botões
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Cor de Fundo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeBgColor}
                      onChange={(e) => setThemeBgColor(e.target.value)}
                      className="size-11 rounded-xl cursor-pointer border-0 p-0 overflow-hidden"
                    />
                    <div className="text-xs text-zinc-500 flex-1 leading-tight">
                      Fundo da página
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Cor dos Textos</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeTextColor}
                      onChange={(e) => setThemeTextColor(e.target.value)}
                      className="size-11 rounded-xl cursor-pointer border-0 p-0 overflow-hidden"
                    />
                    <div className="text-xs text-zinc-500 flex-1 leading-tight">
                      Textos e títulos
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Fonte do Título</label>
                  <select
                    value={themeFont}
                    onChange={(e) => setThemeFont(e.target.value)}
                    className="w-full border h-11 rounded-xl px-4"
                  >
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                    <option value="Inter">Inter</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Fraunces">Fraunces</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium mb-1 block">Fonte do Subtítulo / Descrição</label>
                  <select
                    value={themeSubtitleFont}
                    onChange={(e) => setThemeSubtitleFont(e.target.value)}
                    className="w-full border h-11 rounded-xl px-4"
                  >
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                    <option value="Inter">Inter</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Playfair Display">Playfair Display</option>
                    <option value="Fraunces">Fraunces</option>
                  </select>
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="size-4 text-emerald-600" /> Mapa de Localização
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={showLocationMap} onChange={(e) => setShowLocationMap(e.target.checked)} />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                {showLocationMap && (
                  <div className="mt-2 animate-in fade-in zoom-in duration-200">
                    <input
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      placeholder="Ex: Avenida Paulista, 1000, São Paulo - SP"
                      className="w-full border h-11 rounded-xl px-4"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Digite o endereço completo. O mapa interativo do Google aparecerá no final do cardápio.
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mt-4">
                <div className="text-xs font-semibold text-emerald-900 mb-2 flex items-center gap-1.5">
                  <Check className="size-3.5" /> Pré-visualização do link
                </div>
                <div className="text-[11px] font-mono text-emerald-800 break-all">
                  https://wa.me/{String(whatsappNumber || "").replace(/\D/g, "") || "[NÚMERO]"}
                </div>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => setShowWhatsAppEditor(false)} className="px-5 h-11 rounded-2xl border">
                Fechar
              </button>
              <button
                onClick={async () => {
                  if (tenantId) {
                    try {
                      await setDoc(doc(db, "restaurants", tenantId), {
                        name: restaurantName,
                        whatsappNumber: whatsappNumber,
                        headerSubtitle,
                        headerLogo,
                        themeColor,
                        themeFont,
                        themeSubtitleFont,
                        themeBgColor,
                        themeTextColor,
                        openTime,
                        closeTime,
                        storeType,
                        locationAddress,
                        showLocationMap
                      }, { merge: true });
                      setToast("Configurações salvas!");
                    } catch (e: any) {
                      console.error(e);
                      alert("Erro ao salvar configurações gerais: " + e.message);
                      setToast("Erro ao salvar.");
                    }
                  }
                  setShowWhatsAppEditor(false);
                }}
                className="px-5 h-11 rounded-2xl bg-emerald-600 text-white"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEWS EDITOR */}
      {showReviewsEditor && isAdmin && (
        <div className="fixed inset-0 z-[180] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-amber-100 rounded-xl grid place-items-center">
                  <Star className="size-5 text-amber-600" />
                </div>
                <div className="text-xl font-semibold">Editar Avaliações</div>
              </div>
              <button onClick={() => setShowReviewsEditor(false)}><X /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Nota (ex: 4.9)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={reviews.rating}
                    onChange={(e) => setReviews({ ...reviews, rating: parseFloat(e.target.value) || 0 })}
                    className="w-full border h-11 rounded-xl px-4 text-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">% Recomendam</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={reviews.recommendation}
                    onChange={(e) => setReviews({ ...reviews, recommendation: parseInt(e.target.value) || 0 })}
                    className="w-full border h-11 rounded-xl px-4 text-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Total de avaliações</label>
                  <input
                    type="number"
                    value={reviews.totalReviews}
                    onChange={(e) => setReviews({ ...reviews, totalReviews: parseInt(e.target.value) || 0 })}
                    className="w-full border h-11 rounded-xl px-4"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Total de pedidos</label>
                  <input
                    type="number"
                    value={reviews.totalOrders}
                    onChange={(e) => setReviews({ ...reviews, totalOrders: parseInt(e.target.value) || 0 })}
                    className="w-full border h-11 rounded-xl px-4"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Texto ao lado do %</label>
                <input
                  value={reviews.text}
                  onChange={(e) => setReviews({ ...reviews, text: e.target.value })}
                  className="w-full border h-11 rounded-xl px-4"
                  placeholder="dos clientes recomendam"
                />
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => setShowReviewsEditor(false)} className="px-5 h-11 rounded-2xl border">
                Fechar
              </button>
              <button
                onClick={() => {
                  setToast("Estatísticas de avaliações salvas!");
                  setShowReviewsEditor(false);
                }}
                className="px-5 h-11 rounded-2xl bg-zinc-900 text-white"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckout && (
        <div className="fixed inset-0 z-[190] bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[95vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-emerald-500 rounded-xl grid place-items-center">
                  <MessageCircle className="size-5 text-white" />
                </div>
                <div>
                  <div className="text-lg font-semibold">Finalizar pelo WhatsApp</div>
                  <div className="text-xs text-zinc-500">Seus dados ficam no seu dispositivo</div>
                </div>
              </div>
              <button onClick={() => setShowCheckout(false)}><X /></button>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-4">
              {/* Resumo */}
              <div className="bg-zinc-50 rounded-2xl p-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                  {storeType === "appointment" ? "Seu agendamento" : "Seu pedido"} ({cart.reduce((s, c) => s + c.quantity, 0)} {cart.reduce((s, c) => s + c.quantity, 0) === 1 ? "item" : "itens"})
                </div>
                <div className="space-y-1.5 text-sm">
                  {cart.map((c) => (
                    <div key={c.id} className="flex justify-between">
                      <span className="text-zinc-700">
                        {c.quantity}× {c.name}
                      </span>
                      <span className="font-medium">{formatCurrency(c.price * c.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-zinc-200">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-emerald-700">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  value={customer.name}
                  onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                  placeholder="Seu nome completo"
                  className="w-full border h-11 rounded-xl px-4"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">{storeType === "appointment" ? "Data e Hora Desejada" : "Endereço de entrega"}</label>
                {storeType === "appointment" ? (
                  <input
                    type="datetime-local"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    className="w-full border h-11 rounded-xl px-4"
                  />
                ) : (
                  <textarea
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    placeholder="Rua, número, bairro, cidade (deixe em branco para retirar no local)"
                    rows={2}
                    className="w-full border rounded-xl p-3 resize-none"
                  />
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Observação</label>
                <textarea
                  value={customer.notes}
                  onChange={(e) => setCustomer({ ...customer, notes: e.target.value })}
                  placeholder={storeType === "appointment" ? "Ex: Detalhe importante, observação para o serviço..." : "Ex: sem cebola, troco para R$50, etc."}
                  rows={2}
                  className="w-full border rounded-xl p-3 resize-none"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
                <strong>Importante:</strong> Você será redirecionado para o WhatsApp do restaurante
                com a mensagem pronta para envio.
              </div>
            </div>

            <div className="p-5 border-t bg-zinc-50">
              <button
                onClick={submitCheckout}
                className="w-full h-12 rounded-2xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2"
              >
                <MessageCircle className="size-5" />
                Enviar para o WhatsApp
              </button>
              <button
                onClick={() => setShowCheckout(false)}
                className="w-full h-10 mt-2 rounded-2xl text-sm text-zinc-600"
              >
                Voltar ao cardápio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel */}
      {showAdminPanel && isAdmin && (
        <div className="fixed inset-0 z-[150] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-3xl flex flex-col overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold">Painel Administrativo</div>
                <div className="text-sm text-zinc-500">Edite o cardápio em tempo real</div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowHeroEditor(true);
                    setShowAdminPanel(false);
                  }}
                  className="flex items-center gap-2 px-3 h-10 bg-amber-600 text-white rounded-2xl text-sm font-medium"
                >
                  <ImagePlus className="size-4" /> Capa
                </button>
                <button
                  onClick={() => {
                    setShowPromoEditor(true);
                    setShowAdminPanel(false);
                  }}
                  className="flex items-center gap-2 px-3 h-10 bg-rose-600 text-white rounded-2xl text-sm font-medium"
                >
                  <Tag className="size-4" /> Promoção
                </button>
                <button
                  onClick={() => {
                    setShowWhatsAppEditor(true);
                    setShowAdminPanel(false);
                  }}
                  className="flex items-center gap-2 px-3 h-10 bg-emerald-700 text-white rounded-2xl text-sm font-medium"
                >
                  <Phone className="size-4" /> WhatsApp
                </button>
                <button
                  onClick={() => {
                    setShowReviewsEditor(true);
                    setShowAdminPanel(false);
                  }}
                  className="flex items-center gap-2 px-3 h-10 bg-amber-700 text-white rounded-2xl text-sm font-medium"
                >
                  <Star className="size-4" /> Avaliações
                </button>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 px-3 h-10 bg-emerald-600 text-white rounded-2xl text-sm font-medium"
                >
                  <Plus className="size-4" /> Item
                </button>
                <button
                  onClick={() => {
                    setShowFinanceEditor(true);
                    setShowAdminPanel(false);
                  }}
                  className="flex items-center gap-2 px-3 h-10 bg-indigo-600 text-white rounded-2xl text-sm font-medium"
                >
                  <DollarSign className="size-4" /> Financeiro
                </button>
                <button
                  onClick={logoutAdmin}
                  className="flex items-center gap-2 px-3 h-10 border rounded-2xl text-sm"
                >
                  <LogOut className="size-4" /> Sair
                </button>
                <button onClick={() => setShowAdminPanel(false)}>
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <div className="grid gap-4">
                {menu.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 border border-zinc-200 p-4 rounded-2xl items-center"
                  >
                    <img
                      src={item.images[0] || PLACEHOLDER}
                      className="size-20 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{item.name}</div>
                      <div className="text-sm text-zinc-600 line-clamp-1">{item.description}</div>
                      <div className="text-xs mt-1">
                        R${item.price} • {item.category} • {item.images.length} foto{item.images.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-2 rounded-xl hover:bg-zinc-100"
                      >
                        <Edit2 className="size-4" />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-2 rounded-xl hover:bg-red-50 text-red-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between mb-6">
              <div className="text-xl font-semibold">Editar Item</div>
              <button onClick={() => setEditingItem(null)}>
                <X />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Nome</label>
                  <input
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full border h-11 rounded-xl px-4 mt-1"
                  />
                </div>
                <div className="w-32">
                  <label className="text-sm font-medium">Preço (R$)</label>
                  <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full border h-11 rounded-xl px-4 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Descrição</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full border rounded-xl p-4 h-20 mt-1"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <input
                    list="categoryOptions"
                    placeholder="Ex: Serviços, Promoções..."
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full border h-11 rounded-xl px-4 mt-1"
                  />
                  <datalist id="categoryOptions">
                    {dynamicCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="text-sm font-medium">Tempo (opcional)</label>
                  <input
                    placeholder="Ex: 15 min"
                    value={editingItem.prepTime || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, prepTime: e.target.value })}
                    className="w-full border h-11 rounded-xl px-4 mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Calorias (opcional)</label>
                  <input
                    type="number"
                    placeholder="Ex: 350"
                    value={editingItem.calories || ""}
                    onChange={(e) => setEditingItem({ ...editingItem, calories: parseInt(e.target.value) || undefined })}
                    className="w-full border h-11 rounded-xl px-4 mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Restrições Alimentares</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(dietaryMeta).map((key) => {
                    const d = key as Dietary;
                    const isActive = editingItem.dietary.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() => toggleDietary(d, "edit")}
                        className={cn(
                          "px-3 py-1 rounded-full text-sm border",
                          isActive
                            ? "bg-zinc-900 text-white border-zinc-900"
                            : "border-zinc-300"
                        )}
                      >
                        {dietaryMeta[d].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Multi-image editor */}
              <div>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ImageIcon className="size-4" />
                  Galeria de Imagens ({editingItem.images.length}/10)
                </label>
                <p className="text-xs text-zinc-500 mb-3">
                  A primeira imagem é a capa. Passe o mouse e clique em ⭐ para definir outra como capa.
                </p>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {editingItem.images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border-2"
                         style={{ borderColor: idx === 0 ? "#f59e0b" : "#e4e4e7" }}>
                      <img src={img} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(idx, "edit")}
                        className="absolute top-1 right-1 size-6 grid place-items-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="size-3.5" />
                      </button>
                      {idx !== 0 && (
                        <button
                          onClick={() => setAsCover(idx, "edit")}
                          title="Definir como capa"
                          className="absolute top-1 left-1 size-6 grid place-items-center rounded-full bg-white text-amber-600 opacity-0 group-hover:opacity-100 transition shadow"
                        >
                          <Star className="size-3.5" />
                        </button>
                      )}
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                          <Star className="size-2.5 fill-white" /> CAPA
                        </span>
                      )}
                    </div>
                  ))}
                  {editingItem.images.length < 10 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 grid place-items-center cursor-pointer hover:bg-zinc-50 hover:border-zinc-900">
                      <ImagePlus className="size-6 text-zinc-400" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleSingleImageUpload(e, "edit")}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setEditingItem(null)}
                className="flex-1 h-12 rounded-2xl border"
              >
                Cancelar
              </button>
              <button
                onClick={saveEditedItem}
                className="flex-1 h-12 rounded-2xl bg-zinc-900 text-white"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-[180] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-8 max-h-[92vh] overflow-y-auto">
            <div className="text-xl font-semibold mb-6">Adicionar Novo Item</div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <input
                  placeholder="Nome do produto"
                  value={newItem.name || ""}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="flex-1 border h-11 rounded-xl px-4"
                />
                <input
                  type="number"
                  placeholder="Preço"
                  value={newItem.price || ""}
                  onChange={(e) => setNewItem({ ...newItem, price: parseFloat(e.target.value) || 0 })}
                  className="w-32 border h-11 rounded-xl px-4"
                />
              </div>
              <textarea
                placeholder="Descrição"
                value={newItem.description || ""}
                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                className="w-full border rounded-xl p-4 h-20"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <input
                    list="categoryOptions"
                    placeholder="Categoria (ex: Cortes, Bebidas)"
                    value={newItem.category || ""}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full border h-11 rounded-xl px-4"
                  />
                  <datalist id="categoryOptions">
                    {dynamicCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <input
                  placeholder="Tempo (opcional)"
                  value={newItem.prepTime || ""}
                  onChange={(e) => setNewItem({ ...newItem, prepTime: e.target.value })}
                  className="border h-11 rounded-xl px-4"
                />
                <input
                  type="number"
                  placeholder="Calorias (opcional)"
                  value={newItem.calories || ""}
                  onChange={(e) => setNewItem({ ...newItem, calories: parseInt(e.target.value) || undefined })}
                  className="border h-11 rounded-xl px-4"
                />
              </div>

              <div>
                <div className="text-sm mb-2">Restrições</div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(dietaryMeta).map((key) => {
                    const d = key as Dietary;
                    const active = (newItem.dietary || []).includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() => toggleDietary(d, "new")}
                        className={cn(
                          "px-3 py-1 rounded-full text-sm border",
                          active && "bg-zinc-900 text-white"
                        )}
                      >
                        {dietaryMeta[d].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Multi-image upload for new item */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Galeria de Imagens ({(newItem.images || []).length}/10)
                </label>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {(newItem.images || []).map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border">
                      <img src={img} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(idx, "add")}
                        className="absolute top-1 right-1 size-5 grid place-items-center rounded-full bg-red-500 text-white"
                      >
                        <X className="size-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-zinc-900 text-white text-[9px] px-1 py-0.5 rounded">
                          Capa
                        </span>
                      )}
                    </div>
                  ))}
                  {(newItem.images || []).length < 10 && (
                    <label className="aspect-square rounded-xl border-2 border-dashed border-zinc-300 grid place-items-center cursor-pointer hover:bg-zinc-50">
                      <ImagePlus className="size-6 text-zinc-400" />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleSingleImageUpload(e, "add")}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewItem({});
                }}
                className="flex-1 h-12 rounded-2xl border"
              >
                Cancelar
              </button>
              <button
                onClick={addNewItem}
                className="flex-1 h-12 rounded-2xl bg-emerald-600 text-white"
              >
                Adicionar ao Cardápio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile cart drawer */}
      {showCart && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCart(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] bg-white rounded-t-3xl p-5 overflow-y-auto">
            <div className="flex justify-between mb-4">
              <div className="font-semibold text-xl">{storeType === "appointment" ? "Seu Agendamento" : "Seu Pedido"}</div>
              <button onClick={() => setShowCart(false)}>
                <X />
              </button>
            </div>
            {cart.length === 0 ? (
              <div className="py-8 text-center text-zinc-600">{storeType === "appointment" ? "Nenhum serviço selecionado" : "Seu pedido está vazio"}</div>
            ) : (
              cart.map((ci) => (
                <div key={ci.id} className="flex gap-4 mb-4">
                  <img src={ci.image} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <div className="font-medium">{ci.name}</div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() => updateQty(ci.id, -1)}
                          className="size-7 grid place-items-center rounded-full border"
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-5 text-center">{ci.quantity}</span>
                        <button
                          onClick={() => updateQty(ci.id, 1)}
                          className="size-7 grid place-items-center rounded-full border"
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <div className="font-semibold">R${(ci.price * ci.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {cart.length > 0 && (
              <button
                onClick={openCheckout}
                className="mt-4 w-full h-12 bg-emerald-600 text-white rounded-2xl font-semibold flex items-center justify-center gap-2"
              >
                <MessageCircle className="size-4" />
                Finalizar pelo WhatsApp — R${total.toFixed(2)}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Gallery Item Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[160] bg-black/80 flex items-end sm:items-center justify-center">
          <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto">
            {/* Image Gallery */}
            <div className="relative aspect-[4/3] sm:aspect-[16/9]">
              <img
                src={selectedItem.images[galleryIndex] || PLACEHOLDER}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-full z-10"
              >
                <X />
              </button>

              {selectedItem.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGalleryIndex((prev) =>
                        prev === 0 ? selectedItem.images.length - 1 : prev - 1
                      );
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-10 grid place-items-center rounded-full bg-white/80 backdrop-blur hover:bg-white"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setGalleryIndex((prev) =>
                        prev === selectedItem.images.length - 1 ? 0 : prev + 1
                      );
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-10 grid place-items-center rounded-full bg-white/80 backdrop-blur hover:bg-white"
                  >
                    <ChevronRight className="size-5" />
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {selectedItem.images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setGalleryIndex(idx);
                        }}
                        className={cn(
                          "size-2 rounded-full transition-all",
                          idx === galleryIndex
                            ? "bg-white w-5"
                            : "bg-white/50 hover:bg-white/80"
                        )}
                      />
                    ))}
                  </div>

                  {/* Counter */}
                  <div className="absolute bottom-3 right-4 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded-full">
                    {galleryIndex + 1} / {selectedItem.images.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {selectedItem.images.length > 1 && (
              <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b">
                {selectedItem.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setGalleryIndex(idx)}
                    className={cn(
                      "size-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition",
                      idx === galleryIndex ? "border-amber-500" : "border-transparent opacity-70 hover:opacity-100"
                    )}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="p-6">
              <h2 className="text-3xl font-semibold mb-1">{selectedItem.name}</h2>
              <p className="text-zinc-600">{selectedItem.description}</p>
              <div className="my-4 text-2xl font-bold">R${selectedItem.price}</div>
              <textarea
                id="notes"
                placeholder="Observações para a cozinha"
                className="w-full border rounded-2xl p-4 h-16 text-sm"
              />
              <button
                onClick={() => {
                  const notes = (document.getElementById("notes") as HTMLTextAreaElement)?.value;
                  addToCart(selectedItem, { notes });
                  setSelectedItem(null);
                }}
                className="mt-4 w-full h-12 rounded-2xl bg-zinc-900 text-white font-semibold"
              >
                {storeType === "appointment" ? "Adicionar" : "Adicionar ao Pedido"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Floating WhatsApp Button */}
      {whatsappNumber && (
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-[90] size-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#20bd5a] hover:-translate-y-1 transition-all"
        >
          <MessageCircle className="size-7" />
        </a>
      )}

      {/* FINANCE EDITOR */}
      {showFinanceEditor && isAdmin && (
        <div className="fixed inset-0 z-[180] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-indigo-100 rounded-xl grid place-items-center">
                  <DollarSign className="size-5 text-indigo-700" />
                </div>
                <div className="text-xl font-semibold">Gestão Financeira</div>
              </div>
              <button onClick={() => setShowFinanceEditor(false)}><X /></button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1 bg-zinc-50/50">
              {/* Dashboard */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-white p-3 sm:p-4 rounded-2xl border shadow-sm flex flex-col justify-center items-center sm:items-start text-center sm:text-left">
                  <span className="text-[10px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Entradas</span>
                  <div className="text-sm sm:text-xl font-bold text-emerald-600 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <ArrowUpCircle className="size-4 sm:size-5 shrink-0" />
                    <span>{formatCurrency(transactions.filter(t => t.type === "entry").reduce((a, b) => a + b.value, 0))}</span>
                  </div>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-2xl border shadow-sm flex flex-col justify-center items-center sm:items-start text-center sm:text-left">
                  <span className="text-[10px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Saídas</span>
                  <div className="text-sm sm:text-xl font-bold text-rose-600 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <ArrowDownCircle className="size-4 sm:size-5 shrink-0" />
                    <span>{formatCurrency(transactions.filter(t => t.type === "exit").reduce((a, b) => a + b.value, 0))}</span>
                  </div>
                </div>
                <div className="bg-white p-3 sm:p-4 rounded-2xl border shadow-sm flex flex-col justify-center items-center sm:items-start text-center sm:text-left">
                  <span className="text-[10px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">Saldo</span>
                  <div className="text-sm sm:text-xl font-bold text-zinc-900 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
                    <DollarSign className="size-4 sm:size-5 shrink-0" />
                    <span>{formatCurrency(transactions.reduce((a, b) => b.type === "entry" ? a + b.value : a - b.value, 0))}</span>
                  </div>
                </div>
              </div>

              {/* Add Transaction Form */}
              <div className="bg-white p-5 rounded-2xl border shadow-sm">
                <h3 className="text-sm font-semibold mb-4">Novo Lançamento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                  <div className="sm:col-span-3">
                    <label className="text-xs font-medium mb-1 block">Tipo</label>
                    <select
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as "entry" | "exit" })}
                      className="w-full border h-10 rounded-xl px-3 text-sm"
                    >
                      <option value="entry">Entrada</option>
                      <option value="exit">Saída</option>
                    </select>
                  </div>
                  <div className="sm:col-span-5">
                    <label className="text-xs font-medium mb-1 block">Descrição</label>
                    <input
                      placeholder="Ex: Venda Mesa 04"
                      value={newTransaction.description || ""}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                      className="w-full border h-10 rounded-xl px-3 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="text-xs font-medium mb-1 block">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newTransaction.value || ""}
                      onChange={(e) => setNewTransaction({ ...newTransaction, value: parseFloat(e.target.value) })}
                      className="w-full border h-10 rounded-xl px-3 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <button
                      disabled={!newTransaction.description || !newTransaction.value}
                      onClick={async () => {
                        if (!tenantId || !newTransaction.description || !newTransaction.value) return;
                        const t: Transaction = {
                          id: "t" + Date.now(),
                          type: newTransaction.type as "entry" | "exit",
                          description: newTransaction.description,
                          value: newTransaction.value,
                          date: new Date().toISOString()
                        };
                        
                        setTransactions([t, ...transactions]);
                        setNewTransaction({ type: "entry", description: "", value: 0 });
                        
                        try {
                          const docRef = doc(db, "restaurants", tenantId, "transactions", t.id);
                          await setDoc(docRef, t);
                          setToast("Lançamento adicionado");
                        } catch (err) {
                          console.error(err);
                          alert("Erro ao salvar lançamento");
                        }
                      }}
                      className="h-10 w-full bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50"
                    >
                      <Plus className="size-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Transactions List */}
              <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                {loadingTransactions ? (
                  <div className="p-8 text-center text-zinc-500 text-sm">Carregando...</div>
                ) : transactions.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-sm">Nenhum lançamento registrado.</div>
                ) : (
                  <div className="divide-y">
                    {transactions.map(t => (
                      <div key={t.id} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition">
                        <div className="flex items-center gap-3">
                          <div className={cn("size-8 rounded-full grid place-items-center", t.type === "entry" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                            {t.type === "entry" ? <ArrowUpCircle className="size-4" /> : <ArrowDownCircle className="size-4" />}
                          </div>
                          <div>
                            <div className="font-medium text-sm text-zinc-900">{t.description}</div>
                            <div className="text-xs text-zinc-500">{new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className={cn("font-bold text-sm", t.type === "entry" ? "text-emerald-600" : "text-rose-600")}>
                            {t.type === "entry" ? "+" : "-"}{formatCurrency(t.value)}
                          </div>
                          <button
                            onClick={async () => {
                              if (!tenantId || !confirm("Tem certeza que deseja apagar?")) return;
                              setTransactions(transactions.filter(x => x.id !== t.id));
                              try {
                                await deleteDoc(doc(db, "restaurants", tenantId, "transactions", t.id));
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className="p-1.5 text-zinc-400 hover:text-red-500 transition rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-full bg-zinc-900 text-white text-sm flex items-center gap-2 z-[300]">
          <Check className="size-4 text-emerald-400" /> {toast}
        </div>
      )}

      {/* Closed Alert Modal */}
      {showClosedAlert && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-black text-white text-center py-5 font-bold text-lg px-4">
              Estabelecimento fechado
            </div>
            <div className="p-8 text-center text-zinc-800 font-medium flex flex-col gap-6">
              <p className="text-lg leading-relaxed">
                O estabelecimento abrirá amanhã:<br />
                {openTime} - {closeTime}
              </p>
              <button 
                onClick={() => setShowClosedAlert(false)}
                className="w-full h-14 bg-black text-white font-bold rounded-xl text-lg hover:bg-zinc-800 transition active:scale-95"
              >
                Ok
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
