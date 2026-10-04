import { useState } from "react";
import { BidHistory } from "./components/BidHistory";
import { CatalogBrowser } from "./components/CatalogBrowser";
import { CatalogManager } from "./components/CatalogManager";
import { CustomerContactCard } from "./components/CustomerContactCard";
import { IntroSection } from "./components/IntroSection";
import { Login } from "./components/Login";
import { NegotiationPanel } from "./components/NegotiationPanel";
import { OrderSetup, type OrderPrefill } from "./components/OrderSetup";
import { PaymentPanel } from "./components/PaymentPanel";
import { RoleGate } from "./components/RoleGate";
import { TailorShopCard } from "./components/TailorShopCard";
import { useAuth } from "./context/AuthContext";
import { usePolledOrder } from "./hooks/usePolledOrder";
import type { Party } from "./types";
import "./App.css";

const STATUS_LABEL: Record<string, string> = {
  negotiating: "In negotiation",
  accepted: "Price agreed — awaiting payment",
  rejected: "Negotiation ended",
  confirmed: "Funds locked — ready to start",
};

function App() {
  const { user, profile, loading, logOut } = useAuth();
  const [authView, setAuthView] = useState(false);
  const [loginRole, setLoginRole] = useState<Party | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [managingCatalog, setManagingCatalog] = useState(false);
  const [browsingTailorEmail, setBrowsingTailorEmail] = useState<string | null>(null);
  const [orderPrefill, setOrderPrefill] = useState<OrderPrefill | null>(null);
  const { order, error, setOrder } = usePolledOrder(orderId);

  const signedIn = Boolean(user && profile);

  function handleLeave() {
    setOrderId(null);
  }

  function goHome() {
    setAuthView(false);
    setLoginRole(null);
  }

  return (
    <div className="app">
      <header className="ledger-header">
        <div className="ledger-header__inner ledger-header__row">
          <div>
            <p className="eyebrow">Live order negotiation</p>
            <div className="wordmark-row">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="6" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="6" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 7.5L20 17.5M8 16.5L20 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <h1 className="wordmark">The Cutting Table</h1>
            </div>
            {order && (
              <p className="order-meta">
                Order <code>{order.id}</code> · viewing as <strong>{profile?.role}</strong>
              </p>
            )}
            {profile && (
              <p className="order-meta">
                Signed in as <strong>{profile.name}</strong> ({profile.role}) ·{" "}
                <button type="button" className="link-button" onClick={logOut}>
                  Sign out
                </button>
              </p>
            )}
          </div>
          {!signedIn && !authView && (
            <button type="button" className="nav-login-btn" onClick={() => setAuthView(true)}>
              Log in
            </button>
          )}
        </div>
      </header>

      <main className="content">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : !signedIn ? (
          authView ? (
            loginRole ? (
              <Login role={loginRole} onBack={() => setLoginRole(null)} />
            ) : (
              <RoleGate onSelect={setLoginRole} onBack={goHome} />
            )
          ) : (
            <IntroSection onGetStarted={() => setAuthView(true)} />
          )
        ) : !orderId ? (
          managingCatalog ? (
            <CatalogManager tailorId={profile!.id} onBack={() => setManagingCatalog(false)} />
          ) : browsingTailorEmail ? (
            <CatalogBrowser
              tailorEmail={browsingTailorEmail}
              onBack={() => setBrowsingTailorEmail(null)}
              onSelectProduct={(product) => {
                setOrderPrefill({
                  tailorEmail: browsingTailorEmail,
                  description: product.name,
                  initialAmount: product.price,
                });
                setBrowsingTailorEmail(null);
              }}
            />
          ) : (
            <OrderSetup
              onJoin={setOrderId}
              role={profile!.role}
              identity={profile!.email}
              prefill={orderPrefill}
              onManageCatalog={profile!.role === "tailor" ? () => setManagingCatalog(true) : undefined}
              onBrowseCatalog={profile!.role === "customer" ? setBrowsingTailorEmail : undefined}
            />
          )
        ) : (
          <>
            <button
              type="button"
              className="link-button"
              style={{ display: "block", marginBottom: "1rem" }}
              onClick={handleLeave}
            >
              ← Back to setup
            </button>
            {error && <p className="error">{error}</p>}
            {order && (
              <>
                <div className={`status-banner status-banner--${order.status}`}>
                  {STATUS_LABEL[order.status]}
                </div>
                {profile!.role === "customer" && <TailorShopCard order={order} />}
                {profile!.role === "tailor" && <CustomerContactCard order={order} />}
                <NegotiationPanel order={order} role={profile!.role} onChange={setOrder} />
                <PaymentPanel order={order} role={profile!.role} onChange={setOrder} />
                <BidHistory order={order} />
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
