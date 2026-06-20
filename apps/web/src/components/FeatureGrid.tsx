import type { MarketingFeature } from "../lib/marketingContent";

type FeatureGridProps = {
  features: MarketingFeature[];
  columns?: 2 | 3;
};

export default function FeatureGrid({ features, columns = 2 }: FeatureGridProps) {
  return (
    <div className={`mkt-feature-grid mkt-feature-grid--${columns}`}>
      {features.map((f) => (
        <article
          key={f.id}
          className={`mkt-feature-card mkt-panel mkt-feature-card--${f.accent ?? "pink"}`}
        >
          <h3>{f.title}</h3>
          <p>{f.description}</p>
          {f.bullets && (
            <ul className="mkt-feature-bullets">
              {f.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}
