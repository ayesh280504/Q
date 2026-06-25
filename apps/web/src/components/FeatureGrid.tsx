import type { MarketingFeature } from "../lib/marketingContent";
import ScrollReveal from "./ScrollReveal";

type FeatureGridProps = {
  features: MarketingFeature[];
  columns?: 2 | 3;
};

export default function FeatureGrid({ features, columns = 2 }: FeatureGridProps) {
  return (
    <div className={`mkt-feature-grid mkt-feature-grid--${columns}`}>
      {features.map((f, index) => (
        <ScrollReveal key={f.id} delay={index * 70}>
          <article
            className={`mkt-feature-card mkt-panel mkt-feature-card--${f.accent ?? "pink"}`}
          >
            <h3>{f.title}</h3>
            <p>{f.description}</p>
            {f.bullets && f.bullets.length > 0 && (
              <ul className="mkt-feature-bullets">
                {f.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            )}
          </article>
        </ScrollReveal>
      ))}
    </div>
  );
}
