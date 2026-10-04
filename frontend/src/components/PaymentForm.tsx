import { CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useState } from "react";
import { confirmPayment } from "../api";
import type { Order } from "../types";

interface Props {
  order: Order;
  clientSecret: string;
  onConfirmed: (order: Order) => void;
}

export function PaymentForm({ order, clientSecret, onConfirmed }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLockFunds() {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setBusy(true);
    setError(null);
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (stripeError) {
        setError(stripeError.message ?? "Card authorization failed");
        return;
      }
      if (paymentIntent?.status !== "requires_capture" && paymentIntent?.status !== "succeeded") {
        setError(`Unexpected payment status: ${paymentIntent?.status}`);
        return;
      }

      const updated = await confirmPayment(order.id);
      onConfirmed(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to lock funds");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="muted">
        Use Stripe test card <code>4242 4242 4242 4242</code>, any future expiry, any CVC.
      </p>
      <div className="card-element-wrapper">
        <CardElement options={{ hidePostalCode: true }} />
      </div>
      <button disabled={!stripe || busy} onClick={handleLockFunds}>
        Lock ${order.agreedPrice?.toFixed(2)} for this order
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
