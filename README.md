# US-2.2 — Tailor Bidding & Negotiation (Sprint 2 enabler)

Live negotiation interface between a customer and a tailor to agree on a
final order price, ending in a secure fund-lock (escrow-style hold) once
both sides accept.

This is a POC built to explore the shape of the feature ahead of Sprint 2 —
**not wired into any existing project**, since none existed in this
directory yet. Review with Hemanath and Suyashi before treating any of
these choices (stack, data model, API shape) as final.

## Stack

- `backend/`: Node + Express + TypeScript, Prisma + SQLite for persistence,
  Stripe (test mode) for fund-locking.
- `frontend/`: React + TypeScript + Vite. Live updates via REST polling
  (every 2s) rather than websockets — simpler ops, acceptable latency for
  a negotiation flow that isn't sub-second.

## How negotiation works

- An `Order` has a status: `negotiating` → `accepted` → `confirmed`, or
  `negotiating` → `rejected`.
- Each `Bid` is one offer in the thread: `pending` (awaiting the other
  party), `countered` (superseded), `accepted`, or `rejected`.
- Only one bid is ever `pending` at a time. Whoever did **not** propose
  the pending bid can accept it, reject it, or counter it. You can't
  accept or counter your own offer.
- Accepting sets `Order.agreedPrice` and moves the order to `accepted`.

## How fund-locking works

- Once `accepted`, the customer is shown a Stripe card form.
- The server creates a `PaymentIntent` with `capture_method: "manual"` —
  this **authorizes** the card for the agreed amount without capturing it,
  which is the closest native Stripe primitive to "locking" funds in
  escrow. Capture (or cancel/refund) happens later, tied to whatever
  triggers order completion — not built here since that trigger lives in
  the order-fulfillment side of the system, which doesn't exist yet in
  this repo.
- The server re-verifies the PaymentIntent status directly with Stripe
  (never trusts the client) before marking the order `confirmed`.

## Running it

**Server**

```
cd backend
cp .env.example .env   # fill in STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY
npm install
npm run prisma:migrate
npm run dev             # http://localhost:4000
```

Get test-mode Stripe keys at https://dashboard.stripe.com/test/apikeys.
Without real keys, everything works except the final fund-lock step,
which will fail with a 401 from Stripe (verified during development).

**Client**

```
cd frontend
npm install
npm run dev              # http://localhost:5173
```

**Try it**: open the app in two browser windows. In one, pick "Tailor"
and create an order (defaults are prefilled) — copy the order ID shown
in the header. In the other, pick "Customer" and join that order ID.
Counter-offer back and forth; whoever didn't make the last offer can
accept, reject, or counter. Once accepted, the customer window shows a
card form (`4242 4242 4242 4242`, any future expiry/CVC in Stripe test
mode) to lock the funds.

## What's stubbed / not real yet

- **Auth/identity**: `customerId`/`tailorId` are freeform strings typed
  into the setup form, not real accounts.
- **No websockets**: 2s polling was chosen over sockets for this POC
  (per direction from this ticket's scoping) — fine for negotiation
  pacing, but revisit if sub-second updates matter.
- **No escrow release/refund flow**: capturing or canceling the
  authorized PaymentIntent (i.e., what happens when the order is
  fulfilled or cancelled) isn't implemented — there's no existing
  order-fulfillment system to hook into yet.
- **No real order/user data model**: this repo has no other context
  about how orders, customers, or tailors are represented elsewhere in
  the product.

## Open questions for Hemanath & Suyashi

1. Does an order/customer/tailor data model already exist elsewhere that
   this should integrate with instead of the standalone `Order` model
   here?
2. Is there an existing payment/escrow service we should be calling
   into, or is Stripe manual-capture (as used here) the intended
   mechanism?
3. Real-time expectation: is polling acceptable, or is a websocket/SSE
   requirement already assumed by other Sprint 2 work?
4. Who triggers capture/release of locked funds, and when (order
   completion? delivery confirmation?) — that lifecycle sits outside
   this ticket's scope but determines the `Payment` state machine here.
5. Any constraints on tech stack (this used Express/Prisma/SQLite/React
   purely as a fast default, not because it's mandated).
