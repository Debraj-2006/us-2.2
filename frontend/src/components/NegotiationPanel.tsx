import { useState } from "react";
import { acceptBid, placeCounterOffer, rejectBid } from "../api";
import type { Order, Party } from "../types";
import { NegotiationGauge } from "./NegotiationGauge";

interface Props {
  order: Order;
  role: Party;
  onChange: (order: Order) => void;
}

function partyName(order: Order, party: Party) {
  return (party === "customer" ? order.customerName : order.tailorName) ?? party;
}

export function NegotiationPanel({ order, role, onChange }: Props) {
  const [counterAmount, setCounterAmount] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pendingBid = order.bids.find((b) => b.status === "pending");

  if (order.status !== "negotiating" || !pendingBid) {
    return null;
  }

  const isMyTurnToRespond = pendingBid.proposedBy !== role;

  async function handleAccept() {
    setBusy(true);
    setError(null);
    try {
      const updated = await acceptBid(order.id, pendingBid!.id, role);
      onChange(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setBusy(false);
    }
  }

  async function handleReject() {
    setBusy(true);
    setError(null);
    try {
      const updated = await rejectBid(order.id, pendingBid!.id, role);
      onChange(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setBusy(false);
    }
  }

  async function handleCounter() {
    const amount = Number(counterAmount);
    if (!amount || amount <= 0) {
      setError("Enter a valid counter-offer amount");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await placeCounterOffer(order.id, { amount, proposedBy: role, message: message || undefined });
      setCounterAmount("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send counter-offer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="price-tag">
        <span className="price-tag__hole" aria-hidden="true" />
        <p className="price-tag__label">Current offer</p>
        <p className="price-tag__amount">${pendingBid.amount.toFixed(2)}</p>
        <p className="price-tag__meta">
          from <strong>{partyName(order, pendingBid.proposedBy)}</strong>
          {pendingBid.message && <> — "{pendingBid.message}"</>}
        </p>
      </div>

      {order.bids.length > 1 && <NegotiationGauge bids={order.bids} />}

      {isMyTurnToRespond ? (
        <>
          <div className="button-row">
            <button disabled={busy} onClick={handleAccept}>
              Accept ${pendingBid.amount.toFixed(2)}
            </button>
            <button disabled={busy} className="secondary danger" onClick={handleReject}>
              Reject &amp; end negotiation
            </button>
          </div>

          <div className="counter-form">
            <label className="field">
              Counter-offer ($)
              <input
                type="number"
                min={1}
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
              />
            </label>
            <label className="field">
              Message (optional)
              <input value={message} onChange={(e) => setMessage(e.target.value)} />
            </label>
            <button disabled={busy} onClick={handleCounter}>
              Send counter-offer
            </button>
          </div>
        </>
      ) : (
        <p className="muted">Waiting for {partyName(order, pendingBid.proposedBy === "customer" ? "tailor" : "customer")} to respond…</p>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
}
