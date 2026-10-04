import type { Order } from "../types";

const ICON_PROPS = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

// Shown only to the customer, so they know exactly who they're dealing with
// before agreeing on a price.
export function TailorShopCard({ order }: { order: Order }) {
  if (!order.tailorName) return null;

  return (
    <div className="card shop-card">
      <p className="section-label">Your tailor</p>
      <p className="shop-card__shop">{order.tailorShopName ?? order.tailorName}</p>
      {order.tailorShopName && <p className="shop-card__contact-name">{order.tailorName}</p>}
      <div className="shop-card__details">
        <span className="shop-card__detail">
          <svg {...ICON_PROPS}>
            <path d="M6 4h3l1.5 4L8 9.5a11 11 0 0 0 6.5 6.5l1.5-2.5 4 1.5v3a2 2 0 0 1-2 2C10.5 20 4 13.5 4 6a2 2 0 0 1 2-2Z" />
          </svg>
          {order.tailorPhone ?? "Not provided"}
        </span>
        <span className="shop-card__detail">
          <svg {...ICON_PROPS}>
            <path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21Z" />
            <circle cx="12" cy="9.5" r="2.3" />
          </svg>
          {order.tailorLocation ?? "Not provided"}
        </span>
      </div>
    </div>
  );
}
