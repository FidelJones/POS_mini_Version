import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Package } from "lucide-react";
import { usePOS, formatCurrency, Product } from "@/store/pos";
import { Button } from "@/components/ui/button";

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct } = usePOS();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [touched, setTouched] = useState(false);

  const openAdd = () => { setEditing(null); setName(""); setPrice(""); setTouched(false); setOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setName(p.name); setPrice(String(p.price)); setTouched(false); setOpen(true); };

  const nameErr = touched && !name.trim() ? "Give it a name" : "";
  const priceNum = parseFloat(price);
  const priceErr = touched && (!price || isNaN(priceNum) || priceNum < 0) ? "Enter a valid price" : "";

  const submit = async () => {
    setTouched(true);
    if (!name.trim() || isNaN(priceNum) || priceNum < 0) return;
    if (editing) await updateProduct(editing.id, { name: name.trim(), price: priceNum });
    else await addProduct({ name: name.trim(), price: priceNum });
    setOpen(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} in your catalogue</p>
        </div>
        <Button onClick={openAdd} className="btn-accent h-11 px-5 gap-2">
          <Plus size={18} /> Add product
        </Button>
      </div>

      {products.length === 0 ? (
        <div className="card-soft p-16 text-center">
          <Package className="mx-auto mb-3 text-muted-foreground" />
          <p className="font-medium mb-1">No products yet</p>
          <p className="text-sm text-muted-foreground">Add your first one to get started.</p>
        </div>
      ) : (
        <div className="card-soft overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium hidden md:table-cell">Added</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition">
                  <td className="px-5 py-4 font-medium">{p.name}</td>
                  <td className="px-5 py-4 tabular-nums font-semibold">{formatCurrency(p.price)}</td>
                  <td className="px-5 py-4 text-sm text-muted-foreground hidden md:table-cell">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => openEdit(p)} className="w-8 h-8 rounded-[8px] hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => deleteProduct(p.id)} className="w-8 h-8 rounded-[8px] hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[92%] max-w-md card-elevated p-6 z-50"
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h3 className="font-display font-bold text-xl">{editing ? "Edit product" : "New product"}</h3>
                  <p className="text-sm text-muted-foreground">Keep it simple and clear.</p>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={`input-pos w-full ${nameErr ? "border-destructive/50" : ""}`} placeholder="e.g. Cappuccino" />
                  {nameErr && <p className="text-xs text-destructive mt-1.5">{nameErr}</p>}
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                    <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={`input-pos w-full pl-8 ${priceErr ? "border-destructive/50" : ""}`} placeholder="0.00" />
                  </div>
                  {priceErr && <p className="text-xs text-destructive mt-1.5">{priceErr}</p>}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-[10px]">Cancel</Button>
                  <Button onClick={submit} className="btn-accent h-10 px-5">{editing ? "Save changes" : "Add product"}</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
