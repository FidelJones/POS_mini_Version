import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, Check } from "lucide-react";
import { usePOS, formatCurrency } from "@/store/pos";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Cart({ onAfterRecord }: { onAfterRecord?: () => void }) {
  const { cart, setQty, removeFromCart, recordSale } = usePOS();
  const [success, setSuccess] = useState(false);
  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const handleRecord = async () => {
    const sale = await recordSale();
    if (!sale) return;
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onAfterRecord?.();
    }, 1400);
  };

  return (
    <div className="h-full flex flex-col bg-card">
      <div className="h-16 px-5 flex items-center justify-between border-b border-border/60">
        <div>
          <h2 className="font-display font-semibold text-[15px]">Current sale</h2>
          <p className="text-xs text-muted-foreground">{cart.length} {cart.length === 1 ? "item" : "items"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3" data-tour="cart">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingBag className="text-muted-foreground" />
            </div>
            <p className="font-medium mb-1">No items yet</p>
            <p className="text-sm text-muted-foreground">Tap a product to begin.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {cart.map((item, idx) => (
                <motion.li
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="rounded-[12px] border border-border/60 p-3 bg-background"
                  {...(idx === 0 ? { "data-tour": "qty" } : {})}
                >
                  <div className="flex items-start justify-between mb-2 gap-2">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(item.price)} each</div>
                    </div>
                    <button onClick={() => removeFromCart(item.productId)} className="text-muted-foreground hover:text-destructive transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQty(item.productId, item.quantity - 1)}
                        className="w-8 h-8 rounded-[8px] border border-border bg-background hover:bg-muted transition flex items-center justify-center active:scale-95"
                      >
                        <Minus size={14} />
                      </button>
                      <motion.span key={item.quantity} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-7 text-center font-semibold tabular-nums">
                        {item.quantity}
                      </motion.span>
                      <button
                        onClick={() => setQty(item.productId, item.quantity + 1)}
                        className="w-8 h-8 rounded-[8px] border border-border bg-background hover:bg-muted transition flex items-center justify-center active:scale-95"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <motion.span key={item.quantity * item.price} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-semibold tabular-nums">
                      {formatCurrency(item.price * item.quantity)}
                    </motion.span>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <div className="p-4 border-t border-border/60 space-y-3 bg-card">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <motion.span key={subtotal} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display font-bold text-2xl tabular-nums">
            {formatCurrency(subtotal)}
          </motion.span>
        </div>
        <Button
          data-tour="record"
          onClick={handleRecord}
          disabled={cart.length === 0 || success}
          className="btn-accent w-full h-12 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <AnimatePresence mode="wait">
            {success ? (
              <motion.span key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                <Check size={18} /> Sale recorded
              </motion.span>
            ) : (
              <motion.span key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Record sale
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </div>
  );
}
