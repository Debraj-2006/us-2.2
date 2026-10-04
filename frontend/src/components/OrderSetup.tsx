import { useEffect, useState } from "react";
import { createOrder } from "../api";
import type { Party } from "../types";

export interface OrderPrefill {
  tailorEmail: string;
  description: string;
  initialAmount: number;
}

interface Props {
  onJoin: (orderId: string) => void;
  role: Party;
  identity: string;
  onManageCatalog?: () => void;
  onBrowseCatalog?: (tailorEmail: string) => void;
  prefill?: OrderPrefill | null;
}

export function OrderSetup({ onJoin, role, identity, onManageCatalog, onBrowseCatalog, prefill }: Props) {
  const [existingOrderId, setExistingOrderId] = useState("");
  const [counterpartId, setCounterpartId] = useState("");
  const [description, setDescription] = useState("Custom stitched suit");
  const [initialAmount, setInitialAmount] = useState(1500);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (prefill) {
      setCounterpartId(prefill.tailorEmail);
      setDescription(prefill.description);
      setInitialAmount(prefill.initialAmount);
    }
  }, [prefill]);

  async function handleCreate() {
    if (!counterpartId.trim()) {
      setError(`Enter the ${role === "tailor" ? "customer's" : "tailor's"} email`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const customerId = role === "customer" ? identity : counterpartId.trim();
      const tailorId = role === "tailor" ? identity : counterpartId.trim();
      const order = await createOrder({ customerId, tailorId, description, initialAmount, proposedBy: role });
      onJoin(order.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  function handleJoin() {
    if (!existingOrderId.trim()) {
      setError("Enter an order ID to join");
      return;
    }
    onJoin(existingOrderId.trim());
  }

  return (
    <div className="card">
      <div className="button-row" style={{ justifyContent: "space-between" }}>
        <h2 style={{ margin: 0 }}>Start a negotiation</h2>
        {role === "tailor" && onManageCatalog && (
          <button type="button" className="secondary" onClick={onManageCatalog}>
            Manage my catalog
          </button>
        )}
      </div>

      <div className="setup-columns">
        <section>
          <h3>Open a new order</h3>
          <label className="field">
            Your email ({role})
            <input value={identity} disabled />
          </label>
          <label className="field">
            {role === "tailor" ? "Customer's" : "Tailor's"} email
            <input
              value={counterpartId}
              onChange={(e) => setCounterpartId(e.target.value)}
              placeholder={role === "tailor" ? "customer@example.com" : "tailor@example.com"}
            />
          </label>
          {role === "customer" && onBrowseCatalog && (
            <button
              type="button"
              className="secondary"
              style={{ marginBottom: "0.9rem" }}
              disabled={!counterpartId.trim()}
              onClick={() => onBrowseCatalog(counterpartId.trim())}
            >
              Browse this tailor's catalog
            </button>
          )}
          <label className="field">
            Description
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="field">
            Opening offer ($)
            <input
              type="number"
              min={1}
              value={initialAmount}
              onChange={(e) => setInitialAmount(Number(e.target.value))}
            />
          </label>
          <button disabled={submitting} onClick={handleCreate}>
            Send opening offer
          </button>
        </section>

        <section>
          <h3>Join an order in progress</h3>
          <label className="field">
            Order ID
            <input value={existingOrderId} onChange={(e) => setExistingOrderId(e.target.value)} />
          </label>
          <button onClick={handleJoin}>Join negotiation</button>
        </section>
      </div>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
