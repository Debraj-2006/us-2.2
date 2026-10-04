import { Router } from "express";
import { prisma } from "../db";
import { stripe } from "../stripe";
import { asyncHandler } from "../asyncHandler";

export const ordersRouter = Router();

function otherParty(party: "customer" | "tailor") {
  return party === "customer" ? "tailor" : "customer";
}

// customerId/tailorId are the parties' emails; resolve them to display
// details via the User profiles created at signup, falling back to null if
// whoever holds that email hasn't registered an account (e.g. stale/manual
// test data). Shop details are tailor-only; phone/location are shown to
// whichever party isn't the profile owner, so each side knows who they're
// dealing with.
async function resolveNames(customerId: string, tailorId: string) {
  const [customer, tailor] = await Promise.all([
    prisma.user.findUnique({ where: { email: customerId } }),
    prisma.user.findUnique({ where: { email: tailorId } }),
  ]);
  return {
    customerName: customer?.name ?? null,
    customerPhone: customer?.phone ?? null,
    customerLocation: customer?.location ?? null,
    tailorName: tailor?.name ?? null,
    tailorShopName: tailor?.shopName ?? null,
    tailorPhone: tailor?.phone ?? null,
    tailorLocation: tailor?.location ?? null,
  };
}

// Create an order with an opening offer.
ordersRouter.post("/", asyncHandler(async (req, res) => {
  const { customerId, tailorId, description, initialAmount, proposedBy } = req.body ?? {};

  if (!customerId || !tailorId || !initialAmount || !proposedBy) {
    return res.status(400).json({ error: "customerId, tailorId, initialAmount and proposedBy are required" });
  }
  if (proposedBy !== "customer" && proposedBy !== "tailor") {
    return res.status(400).json({ error: "proposedBy must be 'customer' or 'tailor'" });
  }

  const order = await prisma.order.create({
    data: {
      customerId,
      tailorId,
      description,
      bids: {
        create: {
          amount: initialAmount,
          proposedBy,
          status: "pending",
        },
      },
    },
    include: { bids: true },
  });

  const names = await resolveNames(order.customerId, order.tailorId);
  res.status(201).json({ ...order, ...names });
}));

// Fetch full order state (order + bid history + payment). Polled by the client.
ordersRouter.get("/:orderId", asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.orderId },
    include: {
      bids: { orderBy: { createdAt: "desc" } },
      payment: true,
    },
  });

  if (!order) return res.status(404).json({ error: "Order not found" });
  const names = await resolveNames(order.customerId, order.tailorId);
  res.json({ ...order, ...names });
}));

// Place a counter-offer.
ordersRouter.post("/:orderId/bids", asyncHandler(async (req, res) => {
  const { amount, proposedBy, message } = req.body ?? {};
  const { orderId } = req.params;

  if (!amount || (proposedBy !== "customer" && proposedBy !== "tailor")) {
    return res.status(400).json({ error: "amount and proposedBy ('customer' | 'tailor') are required" });
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { bids: { where: { status: "pending" } } },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status !== "negotiating") {
    return res.status(409).json({ error: `Order is not open for negotiation (status: ${order.status})` });
  }

  const [pendingBid] = order.bids;
  if (pendingBid && pendingBid.proposedBy === proposedBy) {
    return res.status(409).json({ error: "Waiting on the other party to respond before you can counter again" });
  }

  if (pendingBid) {
    await prisma.bid.update({ where: { id: pendingBid.id }, data: { status: "countered" } });
  }
  const newBid = await prisma.bid.create({
    data: { orderId, amount, proposedBy, message, status: "pending" },
  });

  res.status(201).json(newBid);
}));

// Accept the currently pending offer.
ordersRouter.post("/:orderId/bids/:bidId/accept", asyncHandler(async (req, res) => {
  const { acceptedBy } = req.body ?? {};
  const { orderId, bidId } = req.params;

  if (acceptedBy !== "customer" && acceptedBy !== "tailor") {
    return res.status(400).json({ error: "acceptedBy must be 'customer' or 'tailor'" });
  }

  const bid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid || bid.orderId !== orderId) return res.status(404).json({ error: "Bid not found" });
  if (bid.status !== "pending") return res.status(409).json({ error: `Bid is not pending (status: ${bid.status})` });
  if (bid.proposedBy === acceptedBy) {
    return res.status(409).json({ error: "You cannot accept your own offer" });
  }
  if (bid.proposedBy !== otherParty(acceptedBy)) {
    return res.status(400).json({ error: "acceptedBy is invalid for this bid" });
  }

  const [, order] = await prisma.$transaction([
    prisma.bid.update({ where: { id: bidId }, data: { status: "accepted" } }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: "accepted", agreedPrice: bid.amount },
      include: { bids: { orderBy: { createdAt: "desc" } } },
    }),
  ]);

  const names = await resolveNames(order.customerId, order.tailorId);
  res.json({ ...order, ...names });
}));

// Reject the currently pending offer, ending the negotiation.
ordersRouter.post("/:orderId/bids/:bidId/reject", asyncHandler(async (req, res) => {
  const { rejectedBy } = req.body ?? {};
  const { orderId, bidId } = req.params;

  if (rejectedBy !== "customer" && rejectedBy !== "tailor") {
    return res.status(400).json({ error: "rejectedBy must be 'customer' or 'tailor'" });
  }

  const bid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid || bid.orderId !== orderId) return res.status(404).json({ error: "Bid not found" });
  if (bid.status !== "pending") return res.status(409).json({ error: `Bid is not pending (status: ${bid.status})` });

  const [, order] = await prisma.$transaction([
    prisma.bid.update({ where: { id: bidId }, data: { status: "rejected" } }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: "rejected" },
      include: { bids: { orderBy: { createdAt: "desc" } } },
    }),
  ]);

  const names = await resolveNames(order.customerId, order.tailorId);
  res.json({ ...order, ...names });
}));

// Create a Stripe PaymentIntent with manual capture: this authorizes (locks)
// the agreed funds on the customer's card without capturing them, so the
// money is held pending order completion rather than charged immediately.
ordersRouter.post("/:orderId/payment/intent", asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order) return res.status(404).json({ error: "Order not found" });
  if (order.status !== "accepted") {
    return res.status(409).json({ error: `Order must be 'accepted' before locking funds (status: ${order.status})` });
  }
  if (!order.agreedPrice) return res.status(409).json({ error: "Order has no agreed price" });
  if (order.payment) {
    return res.json({ clientSecret: order.payment.clientSecret, publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
  }

  const amountInCents = Math.round(order.agreedPrice * 100);
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    capture_method: "manual", // authorize now, capture later = funds locked/escrowed
    metadata: { orderId: order.id },
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: order.agreedPrice,
      stripePaymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      status: paymentIntent.status,
    },
  });

  res.status(201).json({ clientSecret: paymentIntent.client_secret, publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
}));

// Called by the client after Stripe.js confirms the card on the frontend.
// We re-verify the PaymentIntent status directly with Stripe (never trust
// the client) before marking funds as locked and the order confirmed.
ordersRouter.post("/:orderId/payment/confirm", asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { payment: true } });
  if (!order || !order.payment) return res.status(404).json({ error: "Order or payment not found" });

  const paymentIntent = await stripe.paymentIntents.retrieve(order.payment.stripePaymentIntentId);

  if (paymentIntent.status !== "requires_capture" && paymentIntent.status !== "succeeded") {
    return res.status(409).json({ error: `Payment not authorized yet (status: ${paymentIntent.status})` });
  }

  const [, updatedOrder] = await prisma.$transaction([
    prisma.payment.update({ where: { orderId }, data: { status: paymentIntent.status } }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: "confirmed" },
      include: { bids: { orderBy: { createdAt: "desc" } }, payment: true },
    }),
  ]);

  const names = await resolveNames(updatedOrder.customerId, updatedOrder.tailorId);
  res.json({ ...updatedOrder, ...names });
}));
