import type { ReactNode } from "react";
import { handleTiltLeave, handleTiltMove } from "../tilt";
import type { Party } from "../types";

const ICON_PROPS = {
  width: 30,
  height: 30,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const OPTIONS: {
  role: Party;
  title: string;
  tagline: string;
  points: string[];
  icon: ReactNode;
}[] = [
  {
    role: "customer",
    title: "Customer",
    tagline: "I'm having something made",
    points: ["Open a request with your tailor", "Negotiate the price live", "Lock funds once you agree"],
    icon: (
      <svg {...ICON_PROPS}>
        <path d="M9 4 4 7l2 3 2-1.5V20h8V8.5L18 10l2-3-5-3a2.5 2.5 0 0 1-5 0Z" />
      </svg>
    ),
  },
  {
    role: "tailor",
    title: "Tailor",
    tagline: "I'm making the order",
    points: ["Send your price to a customer", "Negotiate live until you agree", "Get paid once funds are locked"],
    icon: (
      <svg {...ICON_PROPS}>
        <circle cx="6" cy="6" r="2.4" />
        <circle cx="6" cy="18" r="2.4" />
        <path d="M8 7.5L20 17.5M8 16.5L20 6.5" />
      </svg>
    ),
  },
];

interface Props {
  onSelect: (role: Party) => void;
  onBack: () => void;
}

export function RoleGate({ onSelect, onBack }: Props) {
  return (
    <div className="card">
      <button type="button" className="link-button" style={{ display: "block", marginBottom: "1rem" }} onClick={onBack}>
        ← Back to home
      </button>
      <h2>Who's signing in?</h2>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Customers and tailors sign in separately — pick your side to continue.
      </p>
      <div className="role-gate">
        {OPTIONS.map((opt) => (
          <button
            key={opt.role}
            type="button"
            className={`role-gate__option role-gate__option--${opt.role}`}
            onClick={() => onSelect(opt.role)}
            onMouseMove={(e) => handleTiltMove(e, { maxDeg: 7, perspective: 800, lift: 3 })}
            onMouseLeave={handleTiltLeave}
          >
            <span className="role-gate__icon">{opt.icon}</span>
            <span className="role-gate__label">{opt.title}</span>
            <span className="role-gate__hint">{opt.tagline}</span>
            <ul className="role-gate__points">
              {opt.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <span className="role-gate__cta">Continue as {opt.title} →</span>
          </button>
        ))}
      </div>
    </div>
  );
}
