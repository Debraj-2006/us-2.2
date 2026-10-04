import { useEffect, useState } from "react";
import { getCatalogByEmail } from "../api";
import type { Product, TailorCatalog } from "../types";

interface Props {
  tailorEmail: string;
  onBack: () => void;
  onSelectProduct: (product: Product) => void;
}

export function CatalogBrowser({ tailorEmail, onBack, onSelectProduct }: Props) {
  const [catalog, setCatalog] = useState<TailorCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getCatalogByEmail(tailorEmail)
      .then((data) => {
        if (!cancelled) setCatalog(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load catalog");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tailorEmail]);

  return (
    <div className="card">
      <button type="button" className="link-button" style={{ display: "block", marginBottom: "1rem" }} onClick={onBack}>
        ← Back
      </button>

      {loading && <p className="muted">Loading catalog…</p>}
      {error && <p className="error">{error}</p>}

      {catalog && (
        <>
          <h2>{catalog.tailor.shopName ?? catalog.tailor.name}'s catalog</h2>
          {catalog.categories.length === 0 ? (
            <p className="muted">This tailor hasn't listed any items yet.</p>
          ) : (
            catalog.categories.map((category) => (
              <div key={category.id} style={{ marginBottom: "1.5rem" }}>
                <h3>{category.name}</h3>
                {category.products.length === 0 ? (
                  <p className="muted">No items in this category yet.</p>
                ) : (
                  <div className="catalog-grid">
                    {category.products.map((product) => (
                      <div key={product.id} className="catalog-item">
                        {product.imageUrl && (
                          <img src={product.imageUrl} alt={product.name} className="catalog-item__image" />
                        )}
                        <p className="catalog-item__name">{product.name}</p>
                        <p className="catalog-item__price">${product.price.toFixed(2)}</p>
                        {product.description && <p className="muted">{product.description}</p>}
                        <button type="button" onClick={() => onSelectProduct(product)}>
                          Order this
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
