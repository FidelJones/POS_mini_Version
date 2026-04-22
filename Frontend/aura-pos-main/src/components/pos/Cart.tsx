import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, Check } from "lucide-react";
import { usePOS, formatCurrency } from "@/store/pos";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Cart({ onAfterRecord }: { onAfterRecord?: () => void }) {
  const {
    cart,
    setQty,
    removeFromCart,
    recordSale,
    cartCustomerName,
    setCartCustomerName,
    cartNotes,
    setCartNotes,
    nextCustomerSerial,
    advanceCustomerSerial,
  } = usePOS();
  const [success, setSuccess] = useState(false);
  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const tax = 0;
  const discount = 0;
  const total = subtotal;
  const customerId = `js${String(nextCustomerSerial).padStart(6, "0")}`;

  const handleRecord = async () => {
    const sale = await recordSale();
    if (!sale) return;
    advanceCustomerSerial();
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

      <div className="flex-1 overflow-y-auto p-3 space-y-3" data-tour="cart">
        {/* Recipient */}
        <div className="rounded-[12px] border border-border/60 bg-background p-3">
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Recipient</label>
          <input
            type="text"
            placeholder="Customer name"
            value={cartCustomerName}
            onChange={(e) => setCartCustomerName(e.target.value)}
            className="w-full px-3 h-9 rounded-[8px] border border-border/60 bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />

          <label className="text-xs font-medium text-muted-foreground block mt-3 mb-1.5">Note</label>
          <textarea
            placeholder="Special requests or notes..."
            value={cartNotes}
            onChange={(e) => setCartNotes(e.target.value)}
            className="w-full px-3 py-2 rounded-[8px] border border-border/60 bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none h-[74px]"
          />
        </div>

        {/* Items Section */}
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">Items</h3>
              <button
                onClick={() => {
                  setCartCustomerName("");
                  setCartNotes("");
                }}
                className="text-xs text-primary hover:text-primary/80"
              >
                Clear
              </button>
            </div>
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
        <div className="rounded-[14px] border border-border/60 bg-background p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Recipient</span>
            <span className="font-medium text-right ml-3 truncate max-w-[60%]">{cartCustomerName || "Walk-in"}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Customer ID</span>
            <span className="font-semibold tracking-wide">{customerId}</span>
          </div>

          <div className="h-px bg-border/60 my-1" />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span className="font-semibold tabular-nums">{formatCurrency(tax)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Discount</span>
            <span className="font-semibold tabular-nums">{formatCurrency(discount)}</span>
          </div>

          <div className="h-px bg-border/60 my-1" />

          <div className="flex items-center justify-between">
            <span className="font-display font-semibold text-[17px]">Total</span>
            <motion.span key={total} initial={{ y: -4, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-display font-bold text-2xl tabular-nums">
              {formatCurrency(total)}
            </motion.span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            disabled={cart.length === 0}
            className="h-11 rounded-full text-[15px] font-semibold"
          >
            Print
          </Button>

          <Button
            data-tour="record"
            onClick={handleRecord}
            disabled={cart.length === 0 || success}
            className="btn-accent h-11 rounded-full text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AnimatePresence mode="wait">
              {success ? (
                <motion.span key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Check size={18} /> Done
                </motion.span>
              ) : (
                <motion.span key="rec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  Place Order
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </div>
      </div>
    </div>
  );
}
