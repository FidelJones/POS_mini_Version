import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, X } from "lucide-react";
import { usePOS, formatCurrency } from "@/store/pos";
import { Cart } from "@/components/pos/Cart";
import { Button } from "@/components/ui/button";

export default function POS() {
  const { products, cart, addToCart } = usePOS();
  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );
  const cartCount = cart.reduce((s, c) => s + c.quantity, 0);

  return (
    <div className="h-[calc(100vh-4rem)] md:h-[calc(100vh-4rem)] flex">
      {/* Center: products */}
      <section className="flex-1 flex flex-col min-w-0">
        <div className="p-4 md:p-6 border-b border-border/60">
          <div className="relative" data-tour="search">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="input-pos w-full pl-11"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-6" data-tour="grid">
          {filtered.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
              <p className="font-medium">No products match</p>
              <p className="text-sm">Try a different search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {filtered.map((p) => (
                <motion.button
                  key={p.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => addToCart(p.id)}
                  className="card-soft p-5 text-left hover:border-primary/40 transition-all group min-h-[140px] flex flex-col justify-between"
                >
                  <div>
                    {(p.imageUrl || p.image) && (
                      <img
                        src={p.imageUrl ?? p.image ?? ""}
                        alt={p.name}
                        className="w-full h-24 rounded-[12px] object-cover mb-3"
                      />
                    )}
                    <h3 className="font-display font-semibold text-[15px] leading-snug mb-1">{p.name}</h3>
                    <div className="font-display font-bold text-2xl tabular-nums mt-3">{formatCurrency(p.price)}</div>
                  </div>
                  <div className="mt-4 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition">
                    + Add to cart
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Desktop cart */}
      <aside className="hidden lg:flex w-[360px] xl:w-[400px] border-l border-border/60 flex-shrink-0">
        <Cart />
      </aside>

      {/* Mobile/tablet: floating cart button */}
      <button
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden fixed bottom-20 right-4 z-30 btn-accent h-14 px-5 rounded-full flex items-center gap-2 shadow-lg"
      >
        <ShoppingCart size={20} />
        <span className="font-semibold">{formatCurrency(cart.reduce((s, c) => s + c.price * c.quantity, 0))}</span>
        {cartCount > 0 && (
          <span className="ml-1 bg-white/25 text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1.5">
            {cartCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="lg:hidden fixed top-0 right-0 bottom-0 w-full sm:w-[400px] bg-card z-50 flex flex-col"
            >
              <button
                onClick={() => setDrawerOpen(false)}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-muted flex items-center justify-center"
              >
                <X size={18} />
              </button>
              <Cart onAfterRecord={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
