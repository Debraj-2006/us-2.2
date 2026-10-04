import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { Party } from "../types";

const ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "An account with that email already exists — sign in instead.",
  "auth/invalid-credential": "That email or password doesn't match an account.",
  "auth/weak-password": "Use a password with at least 6 characters.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/operation-not-allowed":
    "Email/Password sign-in isn't turned on for this Firebase project yet — enable it under Authentication → Sign-in method in the Firebase console.",
};

function readableAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];
  return err instanceof Error ? err.message : "Something went wrong. Try again.";
}

const COPY: Record<Party, { title: string; blurb: string }> = {
  customer: {
    title: "Customer",
    blurb: "Sign in to negotiate a price with your tailor and lock in funds once you agree.",
  },
  tailor: {
    title: "Tailor",
    blurb: "Sign in to send offers to your customer and get paid once a price is locked in.",
  },
};

interface Props {
  role: Party;
  onBack: () => void;
}

export function Login({ role, onBack }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "sign-up") {
        await signUp(
          email,
          password,
          name,
          role,
          role === "tailor" ? { shopName, phone, location } : { phone, location }
        );
      } else {
        await signIn(email, password, role);
      }
    } catch (err) {
      setError(readableAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`card role-card role-card--${role}`}>
      <button type="button" className="link-button" style={{ display: "block", marginBottom: "1rem" }} onClick={onBack}>
        ← Not {COPY[role].title.toLowerCase()}?
      </button>

      <p className="eyebrow-inline">{COPY[role].title} sign-in</p>
      <h2>{mode === "sign-in" ? "Sign in" : "Create your account"}</h2>
      <p className="muted" style={{ marginBottom: "1.1rem" }}>
        {COPY[role].blurb}
      </p>

      <form onSubmit={handleSubmit}>
        {mode === "sign-up" && (
          <label className="field">
            Your name
            <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
        )}
        {mode === "sign-up" && role === "tailor" && (
          <label className="field">
            Shop name
            <input required value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Ravi Tailoring Co." />
          </label>
        )}
        {mode === "sign-up" && (
          <>
            <label className="field">
              Phone number
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+91 98765 43210"
              />
            </label>
            <label className="field">
              Location
              <input
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Koramangala, Bengaluru"
              />
            </label>
          </>
        )}
        <label className="field">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="field">
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          />
        </label>
        <div className="button-row">
          <button type="submit" disabled={submitting}>
            {mode === "sign-in" ? "Sign in" : "Create account"}
          </button>
          <button
            type="button"
            className="secondary"
            disabled={submitting}
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setError(null);
            }}
          >
            {mode === "sign-in" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  );
}
