import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";
import { createPaymentIntent } from "../api";
import type { Order, Party } from "../types";
import { PaymentForm } from "./PaymentForm";

interface Props {
  order: Order;
  role: Party;
  onChange: (order: Order) => void;
}

const stripePromiseCache = new Map<string, Promise<Stripe | null>>();

function getStripePromise(publishableKey: string) {
  if (!stripePromiseCache.has(publishableKey)) {
    stripePromiseCache.set(publishableKey, loadStripe(publishableKey));
  }
  return stripePromiseCache.get(publishableKey)!;
}

export function PaymentPanel({ order, role, onChange }: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (order.status !== "accepted" || role !== "customer") return;
    let cancelled = false;
    createPaymentIntent(order.id)
      .then((res) => {
        if (!cancelled) {
          setClientSecret(res.clientSecret);
          setPublishableKey(res.publishableKey);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to start payment");
      });
    return () => {
      cancelled = true;
    };
  }, [order.id, order.status, role]);

  if (order.status === "confirmed") {
    return (
      <div className="card card--success">
        <h3>Funds locked — order confirmed</h3>
        <p className="muted">${order.agreedPrice?.toFixed(2)} is held for this order.</p>
      </div>
    );
  }

  if (order.status !== "accepted") return null;

  if (role === "tailor") {
    return (
      <div className="card">
        <h3>Price agreed: ${order.agreedPrice?.toFixed(2)}</h3>
        <p className="muted">Waiting for the customer to lock funds…</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Lock funds for the agreed price</h3>
      {error && <p className="error">{error}</p>}
      {clientSecret && publishableKey ? (
        <Elements stripe={getStripePromise(publishableKey)} options={{ clientSecret }}>
          <PaymentForm order={order} clientSecret={clientSecret} onConfirmed={onChange} />
        </Elements>
      ) : (
        !error && <p className="muted">Preparing secure payment…</p>
      )}
    </div>
  );
}
