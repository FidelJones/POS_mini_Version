import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Product = {
  id: string;
  name: string;
  price: number;
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
  createdAt: string;
};

type State = {
  products: Product[];
  cart: CartItem[];
  sales: Sale[];
  theme: "light" | "dark";
  tutorialDone: boolean;
  addProduct: (p: { name: string; price: number }) => void;
  updateProduct: (id: string, p: { name: string; price: number }) => void;
  deleteProduct: (id: string) => void;
  addToCart: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  recordSale: () => Sale | null;
  setTheme: (t: "light" | "dark") => void;
  setTutorialDone: (v: boolean) => void;
};

const seed: Product[] = [
  { id: "p1", name: "Espresso", price: 3.5, createdAt: new Date().toISOString() },
  { id: "p2", name: "Flat White", price: 4.8, createdAt: new Date().toISOString() },
  { id: "p3", name: "Croissant", price: 3.2, createdAt: new Date().toISOString() },
  { id: "p4", name: "Avocado Toast", price: 9.5, createdAt: new Date().toISOString() },
  { id: "p5", name: "Matcha Latte", price: 5.4, createdAt: new Date().toISOString() },
  { id: "p6", name: "Sparkling Water", price: 2.8, createdAt: new Date().toISOString() },
  { id: "p7", name: "Almond Cake", price: 4.6, createdAt: new Date().toISOString() },
  { id: "p8", name: "Cold Brew", price: 4.2, createdAt: new Date().toISOString() },
];

const uid = () => Math.random().toString(36).slice(2, 10);

export const usePOS = create<State>()(
  persist(
    (set, get) => ({
      products: seed,
      cart: [],
      sales: [],
      theme: "light",
      tutorialDone: false,
      addProduct: ({ name, price }) =>
        set((s) => ({ products: [{ id: uid(), name, price, createdAt: new Date().toISOString() }, ...s.products] })),
      updateProduct: (id, { name, price }) =>
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, name, price } : p)) })),
      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id), cart: s.cart.filter((c) => c.productId !== id) })),
      addToCart: (productId) => {
        const product = get().products.find((p) => p.id === productId);
        if (!product) return;
        set((s) => {
          const existing = s.cart.find((c) => c.productId === productId);
          if (existing) {
            return { cart: s.cart.map((c) => (c.productId === productId ? { ...c, quantity: c.quantity + 1 } : c)) };
          }
          return { cart: [...s.cart, { productId, name: product.name, price: product.price, quantity: 1 }] };
        });
      },
      setQty: (productId, qty) =>
        set((s) => ({
          cart: qty <= 0 ? s.cart.filter((c) => c.productId !== productId) : s.cart.map((c) => (c.productId === productId ? { ...c, quantity: qty } : c)),
        })),
      removeFromCart: (productId) => set((s) => ({ cart: s.cart.filter((c) => c.productId !== productId) })),
      clearCart: () => set({ cart: [] }),
      recordSale: () => {
        const { cart } = get();
        if (cart.length === 0) return null;
        const sale: Sale = {
          id: uid(),
          items: cart.map((c) => ({ productId: c.productId, name: c.name, price: c.price, quantity: c.quantity })),
          total: cart.reduce((sum, c) => sum + c.price * c.quantity, 0),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ sales: [sale, ...s.sales], cart: [] }));
        return sale;
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
      name: "pos-store-v1",
      onRehydrateStorage: () => (state) => {
        if (state?.theme === "dark") document.documentElement.classList.add("dark");
      },
    }
  )
);

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-EU", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(n);
