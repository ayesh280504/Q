import type { ReactNode } from "react";
import MarketingShell from "./MarketingShell";

type CommunityLayoutProps = {
  children: ReactNode;
};

export default function CommunityLayout({ children }: CommunityLayoutProps) {
  return (
    <MarketingShell className="community-page">
      <div className="mkt-page-inner community-page-inner">{children}</div>
    </MarketingShell>
  );
}
