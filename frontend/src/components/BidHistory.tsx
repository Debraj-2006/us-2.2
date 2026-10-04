import type { Bid, Order, Party } from "../types";

const STATUS_LABEL: Record<Bid["status"], string> = {
  pending: "Awaiting response",
  countered: "Superseded",
  accepted: "Accepted",
  rejected: "Rejected",
};

function partyName(order: Order, party: Party) {
  return (party === "customer" ? order.customerName : order.tailorName) ?? party;
}

export function BidHistory({ order }: { order: Order }) {
  if (order.bids.length === 0) return null;

  return (
    <div className="card">
      <h3>Offer history</h3>
      <ul className="bid-history">
        {order.bids.map((bid) => (
          <li key={bid.id} className={`bid-row bid-row--${bid.status}`}>
            <span className="bid-amount">${bid.amount.toFixed(2)}</span>
            <span className={`bid-party bid-party--${bid.proposedBy}`}>{partyName(order, bid.proposedBy)}</span>
            <span className="bid-status">{STATUS_LABEL[bid.status]}</span>
            {bid.message && <span className="bid-message">"{bid.message}"</span>}
            <time className="bid-time">{new Date(bid.createdAt).toLocaleTimeString()}</time>
          </li>
        ))}
      </ul>
    </div>
  );
}
