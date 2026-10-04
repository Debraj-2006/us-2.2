import type { ReactNode } from "react";

const ICON_PROPS = {
  width: 26,
  height: 26,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const FEATURES: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M4 8h11M11 5l4 3-4 3" />
        <path d="M20 16H9M13 13l-4 3 4 3" />
      </svg>
    ),
    title: "Price negotiation",
    body: "Trade offers and counter-offers with a tailor until you both agree — live, no phone calls.",
  },
  {
    icon: (
      <svg {...ICON_PROPS}>
        <rect x="5" y="11" width="14" height="9" rx="1.5" />
        <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
      </svg>
    ),
    title: "Secure fund locking",
    body: "Once you agree on a price, the amount is authorized and held until the order's ready.",
  },
  {
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c1.2-3.8 4.2-5.6 7-5.6s5.8 1.8 7 5.6" />
      </svg>
    ),
    title: "One account, either side",
    body: "Sign in once and pick up any order you've opened or joined from any device.",
  },
];

export function FeatureGrid() {
  return (
    <div className="live-features">
      <p className="section-label section-label--on-dark">Live today</p>
      <div className="live-features__grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="live-feature">
            <span className="live-feature__icon">{f.icon}</span>
            <p className="live-feature__title">{f.title}</p>
            <p className="live-feature__body">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
