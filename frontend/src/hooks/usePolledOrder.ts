import { useEffect, useRef, useState } from "react";
import { getOrder } from "../api";
import type { Order } from "../types";

const POLL_INTERVAL_MS = 2000;

// Polls the order endpoint on an interval so both parties see new offers,
// acceptances, and payment status without reloading the page.
export function usePolledOrder(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }

    let cancelled = false;

    async function poll() {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const latest = await getOrder(orderId!);
        if (!cancelled) {
          setOrder(latest);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load order");
      } finally {
        inFlight.current = false;
      }
    }

    poll();
    const timer = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [orderId]);

  return { order, error, setOrder };
}
