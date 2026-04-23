import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { toast } from "@/components/ui/use-toast";

export type Product = {
  id: string;
  name: string;
  price: number;
  categoryId?: string | null;
  categoryName?: string | null;
  categoryImageUrl?: string | null;
  image?: string | null;
  imageUrl?: string | null;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  image?: string | null;
  imageUrl?: string | null;
  productCount?: number;
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
  taxAmount?: number;
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

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE = configuredApiBase
  ? configuredApiBase.replace(/\/$/, "")
  : import.meta.env.DEV
    ? "/api"
    : "https://pos-mini-version-1.onrender.com/api";
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
  categoryId: raw.categoryId ?? raw.category_id ?? null,
  categoryName: raw.categoryName ?? raw.category_name ?? null,
  categoryImageUrl: raw.categoryImageUrl ?? raw.category_image_url ?? null,
  image: raw.image ?? null,
  imageUrl: raw.imageUrl ?? raw.image_url ?? raw.image ?? null,
  createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
});

const normalizeCategory = (raw: any): Category => ({
  id: String(raw.id),
  name: String(raw.name ?? ""),
  image: raw.image ?? null,
  imageUrl: raw.imageUrl ?? raw.image_url ?? raw.image ?? null,
  productCount: raw.productCount ?? raw.product_count ?? 0,
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
  taxAmount: toNumber(raw.taxAmount ?? raw.tax_amount),
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

const emptyDashboard: DashboardSummary = {
  today_total: 0,
  sales_count: 0,
  average_sale: 0,
  chart_7d: [],
};

type AuthPayload = {
  access: string;
  refresh: string;
};

type CurrentUserPayload = {
  username?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
};

type RegisterPayload = {
  access: string;
  refresh: string;
  user?: CurrentUserPayload;
};

let dashboardRefreshInFlight: Promise<any> | null = null;
let tokenRefreshInFlight: Promise<string | null> | null = null;

function isAuthPath(path: string) {
  return path.startsWith("/auth/");
}

async function extractErrorMessage(response: Response) {
  const fallback = `Request failed (${response.status})`;
  const payloadResponse = response.clone();
  try {
    const payload = await payloadResponse.json();
    if (typeof payload === "string") return payload;
    if (payload?.detail) return String(payload.detail);
    if (payload?.message) return String(payload.message);
    if (payload?.error) return String(payload.error);
    if (Array.isArray(payload?.non_field_errors) && payload.non_field_errors.length > 0) {
      return String(payload.non_field_errors[0]);
    }
    return JSON.stringify(payload);
  } catch {
    const text = await response.text();
    return text || fallback;
  }
}

async function refreshAccessToken() {
  if (tokenRefreshInFlight) return tokenRefreshInFlight;

  const refreshToken = usePOS.getState().refreshToken;
  if (!refreshToken) return null;

  tokenRefreshInFlight = (async () => {
    const response = await fetch(`${API_BASE}/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!response.ok) {
      usePOS.getState().signOut();
      return null;
    }

    const payload = (await response.json()) as { access?: string };
    if (!payload.access) {
      usePOS.getState().signOut();
      return null;
    }

    usePOS.setState({ accessToken: payload.access, isAuthenticated: true });
    return payload.access;
  })();

  try {
    return await tokenRefreshInFlight;
  } finally {
    tokenRefreshInFlight = null;
  }
}

export async function requestJson<T>(path: string, init?: RequestInit, retryOnUnauthorized = true): Promise<T> {
  const hasFormDataBody = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const { accessToken } = usePOS.getState();

  const headers: Record<string, string> = {
    ...(hasFormDataBody ? {} : { "Content-Type": "application/json" }),
    ...((init?.headers as Record<string, string> | undefined) ?? {}),
  };
  if (accessToken && !isAuthPath(path)) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && !isAuthPath(path) && retryOnUnauthorized) {
    const refreshedAccessToken = await refreshAccessToken();
    if (refreshedAccessToken) {
      return requestJson<T>(path, init, false);
    }
    throw new Error("Session expired. Please sign in again.");
  }

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

type State = {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  sales: Sale[];
  dashboard: DashboardSummary | null;
  theme: "light" | "dark";
  tutorialDone: boolean;
  isAuthenticated: boolean;
  signedInAs: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  nextCustomerSerial: number;
  isLoading: boolean;
  error: string | null;
  cartCustomerName: string;
  cartNotes: string;
  initialize: () => Promise<void>;
  refreshDashboard: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  addCategory: (p: { name: string; imageFile?: File | null }) => Promise<Category | null>;
  addProduct: (p: { name: string; price: number; categoryId?: string | null; imageFile?: File | null }) => Promise<Product | null>;
  updateProduct: (
    id: string,
    p: { name: string; price: number; categoryId?: string | null; imageFile?: File | null; removeImage?: boolean }
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
  signIn: (username: string, password: string) => Promise<boolean>;
  signUp: (payload: { username: string; password: string; email?: string; firstName?: string; lastName?: string }) => Promise<boolean>;
  signOut: () => void;
  advanceCustomerSerial: () => void;
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

async function loadCategories() {
  return requestJson<any[]>("/categories/");
}

async function loadCurrentUser() {
  return requestJson<CurrentUserPayload>("/auth/me/");
}

export const usePOS = create<State>()(
  persist(
    (set, get) => ({
      products: defaultProducts,
      categories: [],
      cart: [],
      sales: [],
      dashboard: null,
      theme: "light",
      tutorialDone: false,
      isAuthenticated: false,
      signedInAs: null,
      accessToken: null,
      refreshToken: null,
      nextCustomerSerial: 1,
      isLoading: false,
      error: null,
      cartCustomerName: "",
      cartNotes: "",
      initialize: async () => {
        if (!get().accessToken) {
          get().signOut();
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const [products, categories, sales, dashboard] = await Promise.all([
            seedProductsIfNeeded(),
            loadCategories(),
            requestJson<any[]>("/sales/"),
            requestJson<any>("/dashboard/"),
          ]);

          set({
            products: products.map(normalizeProduct),
            categories: categories.map(normalizeCategory),
            sales: sales.map(normalizeSale),
            dashboard: normalizeDashboard(dashboard),
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to load backend data.";
          set({ error: message, dashboard: emptyDashboard });
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
        if (dashboardRefreshInFlight) {
          const dashboard = await dashboardRefreshInFlight;
          set({ dashboard: normalizeDashboard(dashboard) });
          return;
        }

        dashboardRefreshInFlight = requestJson<any>("/dashboard/");
        try {
          const dashboard = await dashboardRefreshInFlight;
          set({ dashboard: normalizeDashboard(dashboard) });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to refresh dashboard.";
          set({ error: message, dashboard: emptyDashboard });
        } finally {
          dashboardRefreshInFlight = null;
        }
      },
      refreshCategories: async () => {
        try {
          const categories = await loadCategories();
          set({ categories: categories.map(normalizeCategory) });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to refresh categories.";
          set({ error: message });
        }
      },
      addCategory: async ({ name, imageFile }) => {
        try {
          const body = new FormData();
          body.append("name", name);
          if (imageFile) {
            body.append("image", imageFile);
          }

          const category = normalizeCategory(
            await requestJson("/categories/", {
              method: "POST",
              body,
            })
          );

          set((state) => ({ categories: [...state.categories, category], error: null }));
          return category;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to add category.";
          set({ error: message });
          toast({ title: "Add category failed", description: message, variant: "destructive" });
          return null;
        }
      },
      addProduct: async ({ name, price, categoryId, imageFile }) => {
        try {
          const body = new FormData();
          body.append("name", name);
          body.append("price", String(price));
          if (categoryId) {
            body.append("categoryId", categoryId);
          }
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
      updateProduct: async (id, { name, price, categoryId, imageFile, removeImage }) => {
        try {
          const body = new FormData();
          body.append("name", name);
          body.append("price", String(price));
          if (categoryId) {
            body.append("categoryId", categoryId);
          }
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
      signIn: async (username, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/auth/token/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username.trim(), password }),
          });

          if (!response.ok) {
            const message = await extractErrorMessage(response);
            set({ error: message, isAuthenticated: false });
            return false;
          }

          const payload = (await response.json()) as AuthPayload;
          set({
            accessToken: payload.access,
            refreshToken: payload.refresh,
            isAuthenticated: true,
            signedInAs: username.trim(),
            error: null,
          });

          try {
            const currentUser = await loadCurrentUser();
            const displayName =
              currentUser.display_name ||
              `${currentUser.first_name ?? ""} ${currentUser.last_name ?? ""}`.trim() ||
              currentUser.username ||
              currentUser.email ||
              username.trim();
            set({ signedInAs: displayName });
          } catch {
            // Keep the entered username if /auth/me is temporarily unavailable.
          }

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to sign in.";
          set({ error: message, isAuthenticated: false });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },
      signUp: async ({ username, password, email, firstName, lastName }) => {
        set({ isLoading: true, error: null });
        try {
          const response = await fetch(`${API_BASE}/auth/register/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: username.trim(),
              password,
              email: (email ?? "").trim(),
              first_name: (firstName ?? "").trim(),
              last_name: (lastName ?? "").trim(),
            }),
          });

          if (!response.ok) {
            const message = await extractErrorMessage(response);
            set({ error: message, isAuthenticated: false });
            return false;
          }

          const payload = (await response.json()) as RegisterPayload;
          const displayName =
            payload.user?.display_name ||
            `${payload.user?.first_name ?? ""} ${payload.user?.last_name ?? ""}`.trim() ||
            payload.user?.username ||
            payload.user?.email ||
            username.trim();

          set({
            accessToken: payload.access,
            refreshToken: payload.refresh,
            isAuthenticated: true,
            signedInAs: displayName,
            error: null,
          });
          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to sign up.";
          set({ error: message, isAuthenticated: false });
          return false;
        } finally {
          set({ isLoading: false });
        }
      },
      signOut: () =>
        set({
          isAuthenticated: false,
          signedInAs: null,
          accessToken: null,
          refreshToken: null,
          dashboard: null,
          cart: [],
          cartCustomerName: "",
          cartNotes: "",
        }),
      advanceCustomerSerial: () =>
        set((state) => ({
          nextCustomerSerial: state.nextCustomerSerial + 1,
        })),
    }),
    {
      name: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        tutorialDone: state.tutorialDone,
        isAuthenticated: state.isAuthenticated,
        signedInAs: state.signedInAs,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        nextCustomerSerial: state.nextCustomerSerial,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme === "dark") document.documentElement.classList.add("dark");
      },
    }
  )
);

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
