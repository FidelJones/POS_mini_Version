import { type ChangeEvent, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, X, Package, Tag } from "lucide-react";
import { usePOS, formatCurrency, Product, Category } from "@/store/pos";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Products() {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
  } = usePOS();

  const [activeTab, setActiveTab] = useState<"products" | "categories">("products");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [touched, setTouched] = useState(false);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryImageFile, setCategoryImageFile] = useState<File | null>(null);
  const [categoryPreviewUrl, setCategoryPreviewUrl] = useState<string | null>(null);
  const [removeCategoryImage, setRemoveCategoryImage] = useState(false);
  const [categoryTouched, setCategoryTouched] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setPrice("");
    setCategoryId("");
    setImageFile(null);
    setPreviewUrl(null);
    setRemoveImage(false);
    setTouched(false);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name);
    setPrice(String(p.price));
    setCategoryId(p.categoryId ?? "");
    setImageFile(null);
    setPreviewUrl(p.imageUrl ?? p.image ?? null);
    setRemoveImage(false);
    setTouched(false);
    setOpen(true);
  };

  const nameErr = touched && !name.trim() ? "Give it a name" : "";
  const priceNum = parseFloat(price);
  const priceErr = touched && (!price || isNaN(priceNum) || priceNum < 0) ? "Enter a valid price" : "";

  const submit = async () => {
    setTouched(true);
    if (!name.trim() || isNaN(priceNum) || priceNum < 0) return;
    if (editing) {
      await updateProduct(editing.id, {
        name: name.trim(),
        price: priceNum,
        categoryId: categoryId || null,
        imageFile,
        removeImage,
      });
    } else {
      await addProduct({ name: name.trim(), price: priceNum, categoryId: categoryId || null, imageFile });
    }
    setOpen(false);
  };

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryImageFile(null);
    setCategoryPreviewUrl(null);
    setRemoveCategoryImage(false);
    setCategoryTouched(false);
    setCategoryOpen(true);
  };

  const openEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryImageFile(null);
    setCategoryPreviewUrl(category.imageUrl ?? category.image ?? null);
    setRemoveCategoryImage(false);
    setCategoryTouched(false);
    setCategoryOpen(true);
  };

  const submitCategory = async () => {
    setCategoryTouched(true);
    if (!categoryName.trim()) return;

    if (editingCategory) {
      await updateCategory(editingCategory.id, {
        name: categoryName.trim(),
        imageFile: categoryImageFile,
        removeImage: removeCategoryImage,
      });
    } else {
      await addCategory({ name: categoryName.trim(), imageFile: categoryImageFile });
    }

    setCategoryOpen(false);
  };

  const onImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setRemoveImage(false);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      return;
    }
    setPreviewUrl(editing?.imageUrl ?? editing?.image ?? null);
  };

  const onCategoryImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setCategoryImageFile(file);
    setRemoveCategoryImage(false);
    if (file) {
      setCategoryPreviewUrl(URL.createObjectURL(file));
      return;
    }
    setCategoryPreviewUrl(editingCategory?.imageUrl ?? editingCategory?.image ?? null);
  };

  const handleImageLoad = (name: string, imageUrl?: string | null) => {
    console.log("[MEDIA DEBUG] product image loaded", { name, imageUrl });
  };

  const handleImageError = (name: string, imageUrl?: string | null) => {
    console.error("[MEDIA DEBUG] product image failed to load", { name, imageUrl });
  };

  const productCategoryName = (product: Product) => {
    if (!product.categoryId) return "Uncategorized";
    return categories.find((category) => category.id === product.categoryId)?.name ?? "Uncategorized";
  };

  const categoryNameErr = categoryTouched && !categoryName.trim() ? "Give it a category name" : "";

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((product) => {
      if (!product.categoryId) return;
      counts[product.categoryId] = (counts[product.categoryId] ?? 0) + 1;
    });
    return counts;
  }, [products]);

  const uncategorizedCount = useMemo(
    () => products.filter((product) => !product.categoryId).length,
    [products]
  );

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.length} products, {categories.length} categories, {uncategorizedCount} uncategorized
          </p>
        </div>
        <Button
          onClick={activeTab === "products" ? openAdd : openAddCategory}
          className="btn-accent h-11 px-5 gap-2"
        >
          <Plus size={18} /> {activeTab === "products" ? "Add product" : "Add category"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "products" | "categories")}> 
        <TabsList className="mb-4">
          <TabsTrigger value="products" className="gap-1.5">
            <Package size={14} /> Products
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1.5">
            <Tag size={14} /> Categories
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-0">
          {products.length === 0 ? (
            <div className="card-soft p-16 text-center">
              <Package className="mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium mb-1">No products yet</p>
              <p className="text-sm text-muted-foreground">Add your first one to get started.</p>
            </div>
          ) : (
            <>
              <div className="md:hidden space-y-2">
                {products.map((p) => (
                  <div key={p.id} className="card-soft p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-[10px] bg-muted overflow-hidden flex-shrink-0">
                          {p.imageUrl || p.image ? (
                            <img
                              src={p.imageUrl ?? p.image ?? ""}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onLoad={() => handleImageLoad(p.name, p.imageUrl ?? p.image ?? null)}
                              onError={() => handleImageError(p.name, p.imageUrl ?? p.image ?? null)}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">N/A</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{productCategoryName(p)}</div>
                          <div className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                      <div className="text-sm font-semibold tabular-nums">{formatCurrency(p.price)}</div>
                    </div>
                    <div className="flex justify-end gap-1 mt-2">
                      <button
                        onClick={() => openEdit(p)}
                        className="w-8 h-8 rounded-[8px] hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="w-8 h-8 rounded-[8px] hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden md:block card-soft overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[820px]">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                        <th className="px-5 py-3 font-medium">Product</th>
                        <th className="px-5 py-3 font-medium">Category</th>
                        <th className="px-5 py-3 font-medium">Price</th>
                        <th className="px-5 py-3 font-medium hidden md:table-cell">Added</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-[10px] bg-muted overflow-hidden flex-shrink-0">
                                {p.imageUrl || p.image ? (
                                  <img
                                    src={p.imageUrl ?? p.image ?? ""}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                    onLoad={() => handleImageLoad(p.name, p.imageUrl ?? p.image ?? null)}
                                    onError={() => handleImageError(p.name, p.imageUrl ?? p.image ?? null)}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">N/A</div>
                                )}
                              </div>
                              <span className="font-medium">{p.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm">{productCategoryName(p)}</td>
                          <td className="px-5 py-4 tabular-nums font-semibold">{formatCurrency(p.price)}</td>
                          <td className="px-5 py-4 text-sm text-muted-foreground hidden md:table-cell">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => openEdit(p)}
                                className="w-8 h-8 rounded-[8px] hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => deleteProduct(p.id)}
                                className="w-8 h-8 rounded-[8px] hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="categories" className="mt-0">
          {categories.length === 0 ? (
            <div className="card-soft p-16 text-center">
              <Tag className="mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium mb-1">No categories yet</p>
              <p className="text-sm text-muted-foreground">Add your first category to organize products.</p>
            </div>
          ) : (
            <div className="card-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/60">
                      <th className="px-5 py-3 font-medium">Category</th>
                      <th className="px-5 py-3 font-medium">Products</th>
                      <th className="px-5 py-3 font-medium hidden md:table-cell">Created</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-[10px] bg-muted overflow-hidden flex-shrink-0">
                              {category.imageUrl || category.image ? (
                                <img
                                  src={category.imageUrl ?? category.image ?? ""}
                                  alt={category.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                                  {category.name.slice(0, 1).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span className="font-medium">{category.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm">{categoryCounts[category.id] ?? 0}</td>
                        <td className="px-5 py-4 text-sm text-muted-foreground hidden md:table-cell">
                          {new Date(category.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => openEditCategory(category)}
                              className="w-8 h-8 rounded-[8px] hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Delete category \"${category.name}\"? Products under it become uncategorized.`)) {
                                  void deleteCategory(category.id);
                                }
                              }}
                              className="w-8 h-8 rounded-[8px] hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setOpen(false)}
            />
            <div className="fixed inset-0 z-50 grid place-items-center p-4 md:p-6 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                className="w-full max-w-md card-elevated p-6 max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-3rem)] overflow-y-auto"
              >
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-display font-bold text-xl">{editing ? "Edit product" : "New product"}</h3>
                    <p className="text-sm text-muted-foreground">Keep it simple and clear.</p>
                  </div>
                  <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`input-pos w-full ${nameErr ? "border-destructive/50" : ""}`}
                      placeholder="e.g. Cappuccino"
                    />
                    {nameErr && <p className="text-xs text-destructive mt-1.5">{nameErr}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Price</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">UGX</span>
                      <input
                        type="number"
                        step="1"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className={`input-pos w-full pl-14 ${priceErr ? "border-destructive/50" : ""}`}
                        placeholder="0"
                      />
                    </div>
                    {priceErr && <p className="text-xs text-destructive mt-1.5">{priceErr}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-pos w-full">
                      <option value="">Uncategorized</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1.5 text-xs text-muted-foreground">Pick a category or leave this product uncategorized.</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onImageChange}
                      className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-[10px] file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
                    />
                    {previewUrl && !removeImage && (
                      <div className="mt-3 flex items-center gap-3">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-14 h-14 rounded-[10px] object-cover border border-border/60"
                        />
                        {editing && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setImageFile(null);
                              setPreviewUrl(null);
                              setRemoveImage(true);
                            }}
                          >
                            Remove image
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-[10px]">
                      Cancel
                    </Button>
                    <Button onClick={submit} className="btn-accent h-10 px-5">
                      {editing ? "Save changes" : "Add product"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {categoryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setCategoryOpen(false)}
            />
            <div className="fixed inset-0 z-50 grid place-items-center p-4 md:p-6 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.97 }}
                className="w-full max-w-md card-elevated p-6 max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-3rem)] overflow-y-auto"
              >
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-display font-bold text-xl">{editingCategory ? "Edit category" : "New category"}</h3>
                    <p className="text-sm text-muted-foreground">Keep names clear so checkout teams move faster.</p>
                  </div>
                  <button onClick={() => setCategoryOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Name</label>
                    <input
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      className={`input-pos w-full ${categoryNameErr ? "border-destructive/50" : ""}`}
                      placeholder="e.g. Beverages"
                    />
                    {categoryNameErr && <p className="text-xs text-destructive mt-1.5">{categoryNameErr}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onCategoryImageChange}
                      className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-[10px] file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
                    />
                    {categoryPreviewUrl && !removeCategoryImage && (
                      <div className="mt-3 flex items-center gap-3">
                        <img
                          src={categoryPreviewUrl}
                          alt="Category preview"
                          className="w-14 h-14 rounded-[10px] object-cover border border-border/60"
                        />
                        {editingCategory && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setCategoryImageFile(null);
                              setCategoryPreviewUrl(null);
                              setRemoveCategoryImage(true);
                            }}
                          >
                            Remove image
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" onClick={() => setCategoryOpen(false)} className="rounded-[10px]">
                      Cancel
                    </Button>
                    <Button onClick={submitCategory} className="btn-accent h-10 px-5">
                      {editingCategory ? "Save changes" : "Add category"}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
