import { useEffect, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { createCategory, createProduct, deleteCategory, deleteProduct, getCategories, getProducts } from "../api";
import { storage } from "../firebase";
import type { Category, Product } from "../types";

interface Props {
  tailorId: string;
  onBack: () => void;
}

export function CatalogManager({ tailorId, onBack }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void refresh();
  }, [tailorId]);

  async function refresh() {
    setLoading(true);
    try {
      const [cats, prods] = await Promise.all([getCategories(tailorId), getProducts(tailorId)]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    setError(null);
    try {
      const category = await createCategory(tailorId, newCategoryName.trim());
      setCategories((prev) => [...prev, category]);
      setNewCategoryName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category");
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    setError(null);
    try {
      await deleteCategory(tailorId, categoryId);
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      setProducts((prev) => prev.filter((p) => p.categoryId !== categoryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category");
    }
  }

  async function handleDeleteProduct(productId: string) {
    setError(null);
    try {
      await deleteProduct(tailorId, productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
    }
  }

  if (loading) return <p className="muted">Loading your catalog…</p>;

  return (
    <div className="card">
      <button type="button" className="link-button" style={{ display: "block", marginBottom: "1rem" }} onClick={onBack}>
        ← Back
      </button>
      <h2>My catalog</h2>

      <label className="field">
        New category (e.g. Shirts, Jeans, Kurta)
        <div className="button-row" style={{ margin: "0.3rem 0 0" }}>
          <input
            style={{ flex: 1 }}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name"
          />
          <button type="button" onClick={handleAddCategory}>
            Add category
          </button>
        </div>
      </label>

      {error && <p className="error">{error}</p>}

      {categories.length === 0 ? (
        <p className="muted">No categories yet — add one above to start listing items.</p>
      ) : (
        categories.map((category) => (
          <CategorySection
            key={category.id}
            category={category}
            products={products.filter((p) => p.categoryId === category.id)}
            tailorId={tailorId}
            onDeleteCategory={() => handleDeleteCategory(category.id)}
            onDeleteProduct={handleDeleteProduct}
            onProductCreated={(product) => setProducts((prev) => [...prev, product])}
          />
        ))
      )}
    </div>
  );
}

function CategorySection({
  category,
  products,
  tailorId,
  onDeleteCategory,
  onDeleteProduct,
  onProductCreated,
}: {
  category: Category;
  products: Product[];
  tailorId: string;
  onDeleteCategory: () => void;
  onDeleteProduct: (productId: string) => void;
  onProductCreated: (product: Product) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddProduct() {
    if (!name.trim() || !price || Number(price) <= 0) {
      setError("Name and a positive price are required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        const path = `catalog/${tailorId}/${crypto.randomUUID()}-${imageFile.name}`;
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      const product = await createProduct(tailorId, {
        categoryId: category.id,
        name: name.trim(),
        price: Number(price),
        imageUrl,
        description: description.trim() || undefined,
      });
      onProductCreated(product);
      setName("");
      setPrice("");
      setDescription("");
      setImageFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ borderTop: "1px dashed var(--line)", paddingTop: "1.1rem", marginTop: "1.1rem" }}>
      <div className="button-row" style={{ justifyContent: "space-between", margin: "0 0 0.75rem" }}>
        <h3 style={{ margin: 0 }}>{category.name}</h3>
        <button type="button" className="secondary danger" onClick={onDeleteCategory}>
          Delete category
        </button>
      </div>

      {products.length > 0 && (
        <div className="catalog-grid">
          {products.map((product) => (
            <div key={product.id} className="catalog-item">
              {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="catalog-item__image" />}
              <p className="catalog-item__name">{product.name}</p>
              <p className="catalog-item__price">${product.price.toFixed(2)}</p>
              {product.description && <p className="muted">{product.description}</p>}
              <button type="button" className="secondary danger" onClick={() => onDeleteProduct(product.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="setup-columns" style={{ marginTop: "0.9rem" }}>
        <label className="field" style={{ flex: 1 }}>
          Item name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Slim-fit jeans" />
        </label>
        <label className="field" style={{ flex: 1 }}>
          Price ($)
          <input
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
          />
        </label>
      </div>
      <label className="field">
        Description (optional)
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className="field">
        Photo (optional)
        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
      </label>
      {error && <p className="error">{error}</p>}
      <button type="button" disabled={submitting} onClick={handleAddProduct}>
        {submitting ? "Adding…" : "Add item"}
      </button>
    </div>
  );
}
