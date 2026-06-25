import BoothLayout from "../components/BoothLayout";
import ScrollReveal from "../components/ScrollReveal";
import { INTEGRATIONS } from "../lib/integrations";

export default function IntegrationsPage() {
  const live = INTEGRATIONS.filter((i) => i.status === "live");
  const partial = INTEGRATIONS.filter((i) => i.status === "partial");
  const planned = INTEGRATIONS.filter((i) => i.status === "planned");

  return (
    <BoothLayout>
      <section className="booth-hero booth-hero--compact">
        <p className="booth-kicker booth-kicker--cyan">
          <span className="booth-kicker-dot" aria-hidden />
          Integrations
        </p>
        <h1 className="booth-section-title">What connects today.</h1>
        <p className="booth-lead">Honest status — booth depth, not logo fluff.</p>
      </section>

      {[
        { title: "Live", items: live, className: "int-live" },
        { title: "Partial", items: partial, className: "int-partial" },
        { title: "Roadmap", items: planned, className: "int-planned" },
      ].map((section) =>
        section.items.length === 0 ? null : (
          <section key={section.title} className="booth-section">
            <h2 className="booth-section-title">{section.title}</h2>
            <ul className="integrations-grid">
              {section.items.map((item, index) => (
                <ScrollReveal key={item.id} delay={index * 50}>
                  <li className={`integration-card mkt-panel ${section.className}`}>
                    <span className={`integration-badge integration-badge--${item.status}`}>
                      {item.status === "live"
                        ? "Live"
                        : item.status === "partial"
                          ? "Partial"
                          : "Planned"}
                    </span>
                    <h3>{item.name}</h3>
                    <p>{item.detail}</p>
                  </li>
                </ScrollReveal>
              ))}
            </ul>
          </section>
        ),
      )}
    </BoothLayout>
  );
}
