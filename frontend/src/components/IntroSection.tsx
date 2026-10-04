import { FeatureGrid } from "./FeatureGrid";
import { HeroVisual } from "./HeroVisual";
import { ProcessFlow } from "./ProcessFlow";

interface Props {
  onGetStarted: () => void;
}

export function IntroSection({ onGetStarted }: Props) {
  return (
    <div className="intro">
      <div className="hero">
        <div className="hero__copy">
          <p className="eyebrow-inline intro__kicker">The tailoring marketplace</p>
          <h2 className="intro__headline">
            Find a tailor. <span className="intro__headline-accent">Negotiate a price.</span> Lock it in.
          </h2>
          <p className="intro__lede">
            The Cutting Table connects customers with tailors — agree on a price live, offer by offer,
            and lock in the funds so both sides can trust the deal before a single stitch is made.
          </p>
          <button type="button" className="hero__cta" onClick={onGetStarted}>
            Get started
          </button>
        </div>
        <HeroVisual />
      </div>

      <ProcessFlow />
      <FeatureGrid />
    </div>
  );
}
