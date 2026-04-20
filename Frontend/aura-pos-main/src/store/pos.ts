import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { toast } from "@/components/ui/use-toast";

export type Product = {
  id: string;
  name: string;
  price: number;
  image?: string | null;
  imageUrl?: string | null;
  createdAt: string;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Sale = {
  id: string;
  items: { productId: string; name: string; price: number; quantity: number }[];
  total: number;
  customerName?: string;
  notes?: string;
  createdAt: string;
};

export type DashboardPoint = {
  date: string;
  day: string;
  revenue: number;
};

export type DashboardSummary = {
  today_total: number;
  sales_count: number;
  average_sale: number;
  chart_7d: DashboardPoint[];
  product_count?: number;
  top_name?: string;
};

const defaultProducts: Product[] = [
  { id: "p1", name: "Espresso", price: 3.5, createdAt: new Date().toISOString() },
  { id: "p2", name: "Flat White", price: 4.8, createdAt: new Date().toISOString() },
  { id: "p3", name: "Croissant", price: 3.2, createdAt: new Date().toISOString() },
  { id: "p4", name: "Avocado Toast", price: 9.5, createdAt: new Date().toISOString() },
  { id: "p5", name: "Matcha Latte", price: 5.4, createdAt: new Date().toISOString() },
  { id: "p6", name: "Sparkling Water", price: 2.8, createdAt: new Date().toISOString() },
  { id: "p7", name: "Almond Cake", price: 4.6, createdAt: new Date().toISOString() },
  { id: "p8", name: "Cold Brew", price: 4.2, createdAt: new Date().toISOString() },
];

const API_BASE = "/api";
const STORE_VERSION = "pos-store-v2";

const uid = () => Math.random().toString(36).slice(2, 10);

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeProduct = (raw: any): Product => ({
  id: String(raw.id),
  name: String(raw.name ?? ""),
  price: toNumber(raw.price),
  image: raw.image ?? null,
  imageUrl: raw.imageUrl ?? raw.image_url ?? raw.image ?? null,
  createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
});

const normalizeSale = (raw: any): Sale => ({
  id: String(raw.id),
  items: Array.isArray(raw.items)
    ? raw.items.map((item: any) => ({
        productId: String(item.productId ?? item.product_id ?? ""),
        name: String(item.name ?? ""),
        price: toNumber(item.price),
        quantity: toNumber(item.quantity),
      }))
    : [],
  total: toNumber(raw.total),
  customerName: raw.customerName ?? raw.customer_name ?? undefined,
  notes: raw.notes ?? undefined,
  createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
});

const normalizeDashboard = (raw: any): DashboardSummary => ({
  today_total: toNumber(raw.today_total ?? raw.todayRevenue),
  sales_count: toNumber(raw.sales_count ?? raw.todayCount),
  average_sale: toNumber(raw.average_sale ?? raw.avgSale),
  chart_7d: Array.isArray(raw.chart_7d ?? raw.chart)
    ? (raw.chart_7d ?? raw.chart).map((point: any) => ({
        date: String(point.date ?? ""),
        day: String(point.day ?? ""),
        revenue: toNumber(point.revenue),
      }))
    : [],
  product_count: raw.product_count != null ? toNumber(raw.product_count) : undefined,
  top_name: raw.top_name ?? raw.topName ?? undefined,
});

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const hasFormDataBody = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(hasFormDataBody ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = await response.json();
      message = payload.detail || payload.message || JSON.stringify(payload);
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

type State = {
  products: Product[];
  cart: CartItem[];
  sales: Sale[];
  dashboard: DashboardSummary | null;
  theme: "light" | "dark";
  tutorialDone: boolean;
  isLoading: boolean;
  error: string | null;
  cartCustomerName: string;
  cartNotes: string;
  initialize: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  addProduct: (p: { name: string; price: number; imageFile?: File | null }) => Promise<Product | null>;
  updateProduct: (
    id: string,
    p: { name: string; price: number; imageFile?: File | null; removeImage?: boolean }
  ) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<void>;
  addToCart: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setCartCustomerName: (name: string) => void;
  setCartNotes: (notes: string) => void;
  recordSale: () => Promise<Sale | null>;
  setTheme: (t: "light" | "dark") => void;
  setTutorialDone: (v: boolean) => void;
};

async function seedProductsIfNeeded() {
  const current = await requestJson<any[]>("/products/");
  if (current.length > 0) return current;

  await Promise.all(
    defaultProducts.map((product) =>
      requestJson("/products/", {
        method: "POST",
        body: JSON.stringify({ name: product.name, price: product.price }),
      })
    )
  );

  return requestJson<any[]>("/products/");
}

export const usePOS = create<State>()(
  persist(
    (set, get) => ({
      products: defaultProducts,
      cart: [],
      sales: [],
      dashboard: null,
      theme: "light",
      tutorialDone: false,
      isLoading: false,
      error: null,
      cartCustomerName: "",
      cartNotes: "",
      initialize: async () => {
        set({ isLoading: true, error: null });
        try {
          const [products, sales, dashboard] = await Promise.all([
            seedProductsIfNeeded(),
            requestJson<any[]>("/sales/"),
            requestJson<any>("/dashboard/"),
          ]);

          set({
            products: products.map(normalizeProduct),
            sales: sales.map(normalizeSale),
            dashboard: normalizeDashboard(dashboard),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load backend data.";
          set({ error: message });
          toast({
            title: "Could not load data",
            description: message,
            variant: "destructive",
          });
        } finally {
          set({ isLoading: false });
        }
      },
      refreshDashboard: async () => {
        try {
          const dashboard = await requestJson<any>("/dashboard/");
          set({ dashboard: normalizeDashboard(dashboard) });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to refresh dashboard.";
          set({ error: message });
        }
      },
      addProduct: async ({ name, price, imageFile }) => {
        try {
          const body = new FormData();
          body.append("name", name);
          body.append("price", String(price));
          if (imageFile) {
            body.append("image", imageFile);
          }

          const product = normalizeProduct(
            await requestJson("/products/", {
              method: "POST",
              body,
            })
          );

          set((state) => ({ products: [product, ...state.products], error: null }));
          void get().refreshDashboard();
          return product;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to add product.";
          set({ error: message });
          toast({ title: "Add product failed", description: message, variant: "destructive" });
          return null;
        }
      },
      updateProduct: async (id, { name, price, imageFile, removeImage }) => {
        try {
          const body = new FormData();
          body.append("name", name);
          body.append("price", String(price));
          if (imageFile) {
            body.append("image", imageFile);
          } else if (removeImage) {
            body.append("image", "");
          }

          const product = normalizeProduct(
            await requestJson(`/products/${id}/`, {
              method: "PATCH",
              body,
            })
          );

          set((state) => ({
            products: state.products.map((item) => (item.id === id ? product : item)),
            error: null,
          }));
          void get().refreshDashboard();
          return product;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to update product.";
          set({ error: message });
          toast({ title: "Update product failed", description: message, variant: "destructive" });
          return null;
        }
      },
      deleteProduct: async (id) => {
        const previous = get().products;
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
          cart: state.cart.filter((item) => item.productId !== id),
          error: null,
        }));

        try {
          await requestJson(`/products/${id}/`, { method: "DELETE" });
          void get().refreshDashboard();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to delete product.";
          set({ products: previous, error: message });
          toast({ title: "Delete product failed", description: message, variant: "destructive" });
        }
      },
      addToCart: (productId) => {
        const product = get().products.find((item) => item.id === productId);
        if (!product) return;

        set((state) => {
          const existing = state.cart.find((item) => item.productId === productId);
          if (existing) {
            return {
              cart: state.cart.map((item) =>
                item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
              ),
            };
          }

          return {
            cart: [...state.cart, { productId, name: product.name, price: product.price, quantity: 1 }],
          };
        });
      },
      setQty: (productId, qty) =>
        set((state) => ({
          cart:
            qty <= 0
              ? state.cart.filter((item) => item.productId !== productId)
              : state.cart.map((item) => (item.productId === productId ? { ...item, quantity: qty } : item)),
        })),
      removeFromCart: (productId) => set((state) => ({ cart: state.cart.filter((item) => item.productId !== productId) })),
      clearCart: () => set({ cart: [], cartCustomerName: "", cartNotes: "" }),
      setCartCustomerName: (name) => set({ cartCustomerName: name }),
      setCartNotes: (notes) => set({ cartNotes: notes }),
      recordSale: async () => {
        const { cart, cartCustomerName, cartNotes } = get();
        if (cart.length === 0) return null;

        try {
          const sale = normalizeSale(
            await requestJson("/sales/", {
              method: "POST",
              body: JSON.stringify({
                items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
                customer_name: cartCustomerName,
                notes: cartNotes,
              }),
            })
          );

          set((state) => ({ sales: [sale, ...state.sales], cart: [], cartCustomerName: "", cartNotes: "", error: null }));
          void get().refreshDashboard();
          return sale;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to record sale.";
          set({ error: message });
          toast({ title: "Record sale failed", description: message, variant: "destructive" });
          return null;
        }
      },
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== "undefined") {
          document.documentElement.classList.toggle("dark", theme === "dark");
        }
      },
      setTutorialDone: (v) => set({ tutorialDone: v }),
    }),
    {
      name: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme, tutorialDone: state.tutorialDone }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme === "dark") document.documentElement.classList.add("dark");
      },
    }
  )
);

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-EU", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
