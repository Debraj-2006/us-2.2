import type { Bid } from "../types";

// Plots every offer on a shared price line, in the order they were made, so
// both sides can see the gap closing (or not) at a glance — a tape-measure
// reading of the negotiation rather than just a list of numbers.
export function NegotiationGauge({ bids }: { bids: Bid[] }) {
  const chronological = [...bids].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const amounts = chronological.map((b) => b.amount);
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);
  const span = Math.max(max - min, Math.max(max, 1) * 0.08, 20);
  const padded = { min: Math.max(0, min - span * 0.18), max: max + span * 0.18 };
  const scale = padded.max - padded.min || 1;

  function leftPercent(amount: number) {
    return ((amount - padded.min) / scale) * 100;
  }

  return (
    <div className="gauge">
      <p className="gauge__label">Offers so far</p>
      <div className="gauge__track">
        <div
          className="gauge__range"
          style={{ left: `${leftPercent(min)}%`, width: `${leftPercent(max) - leftPercent(min)}%` }}
        />
        {chronological.map((bid, index) => {
          const modifiers = [`gauge__point--${bid.proposedBy}`, index % 2 === 0 ? "gauge__point--up" : "gauge__point--down"];
          if (bid.status === "accepted") modifiers.push("gauge__point--accepted");
          if (bid.status === "pending") modifiers.push("gauge__point--current");

          return (
            <div
              key={bid.id}
              className={`gauge__point ${modifiers.join(" ")}`}
              style={{ left: `${leftPercent(bid.amount)}%` }}
            >
              <span className="gauge__tag">${bid.amount.toFixed(0)}</span>
              <span className="gauge__dot" />
            </div>
          );
        })}
      </div>
      <div className="gauge__scale">
        <span>${padded.min.toFixed(0)}</span>
        <span>${padded.max.toFixed(0)}</span>
      </div>
    </div>
  );
}
