import type { ReactNode } from "react";
import MarketingShell from "./MarketingShell";

type BoothLayoutProps = {
  children: ReactNode;
};

export default function BoothLayout({ children }: BoothLayoutProps) {
  return (
    <MarketingShell className="booth-page">
      <div className="mkt-page-inner booth-page-inner">{children}</div>
    </MarketingShell>
  );
}
