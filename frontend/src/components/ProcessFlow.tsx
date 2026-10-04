const STEPS = [
  { title: "Negotiate", body: "Trade offers back and forth in real time — no phone calls, no waiting for email." },
  { title: "Agree", body: "Either side can accept, reject, or counter. Once one of you accepts, the price is set." },
  { title: "Lock funds", body: "The customer authorizes the agreed amount so it's held before work starts." },
];

export function ProcessFlow() {
  return (
    <div className="how-it-works">
      <p className="section-label">How it works</p>
      <div className="how-it-works__track">
        {STEPS.map((step, i) => (
          <div key={step.title} className="how-it-works__step">
            <span className="how-it-works__node">{i + 1}</span>
            <p className="how-it-works__title">{step.title}</p>
            <p className="how-it-works__body">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
