import { handleTiltLeave, handleTiltMove } from "../tilt";

export function HeroVisual() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <div
        className="hero-visual__stage"
        onMouseMove={(e) => handleTiltMove(e, { maxDeg: 12 })}
        onMouseLeave={handleTiltLeave}
      >
        <div className="hero-chip hero-chip--tailor">
          <span className="hero-chip__label">Tailor</span>
          <span className="hero-chip__amount">$1500</span>
        </div>
        <div className="hero-chip hero-chip--customer">
          <span className="hero-chip__label">Customer</span>
          <span className="hero-chip__amount">$1200</span>
        </div>
        <div className="hero-chip hero-chip--locked">
          <span className="hero-chip__label">Agreed &amp; locked</span>
          <span className="hero-chip__amount">$1350</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="hero-chip__lock">
            <rect x="5" y="11" width="14" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="M8 11V7.5a4 4 0 0 1 8 0V11" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </div>
      </div>
    </div>
  );
}
