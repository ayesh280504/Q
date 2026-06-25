import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import MarketingShell from "./MarketingShell";
import ScrollReveal from "./ScrollReveal";

type BoothLayoutProps = {
  children: ReactNode;
};

function isSection(child: ReactElement): boolean {
  return typeof child.type === "string" && child.type === "section";
}

export default function BoothLayout({ children }: BoothLayoutProps) {
  let sectionIndex = 0;

  return (
    <MarketingShell className="booth-page">
      <div className="mkt-page-inner booth-page-inner">
        {Children.map(children, (child) => {
          if (!isValidElement(child)) return child;
          if (!isSection(child)) return child;

          const delay = Math.min(sectionIndex * 60, 180);
          sectionIndex += 1;
          return (
            <ScrollReveal key={child.key ?? `section-${sectionIndex}`} delay={delay}>
              {child}
            </ScrollReveal>
          );
        })}
      </div>
    </MarketingShell>
  );
}
