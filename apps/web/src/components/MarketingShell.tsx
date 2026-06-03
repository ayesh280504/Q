import type { ReactNode } from "react";
import SiteNav from "./SiteNav";
import QFooter from "./QFooter";

type MarketingShellProps = {
  children: ReactNode;
  /** Use fixed nav over hero (homepage only) */
  navOverHero?: boolean;
  /** Shared gradient footer; set false for custom footer */
  footer?: boolean;
  className?: string;
};

/**
 * Full-width sticky nav + content aligned to the same horizontal rails as the homepage.
 */
export default function MarketingShell({
  children,
  navOverHero = false,
  footer = true,
  className,
}: MarketingShellProps) {
  return (
    <div className={["mkt-page", className].filter(Boolean).join(" ")}>
      <div className={navOverHero ? undefined : "mkt-page-header"}>
        <SiteNav overHero={navOverHero} variant="marketing" />
      </div>
      <div className="mkt-page-body">{children}</div>
      {footer ? (
        <footer className="mkt-page-footer">
          <QFooter />
        </footer>
      ) : null}
    </div>
  );
}
