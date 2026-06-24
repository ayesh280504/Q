import type { ReactNode } from "react";
import SiteNav from "./SiteNav";
import QFooter from "./QFooter";
import FollowingLiveBanner from "./FollowingLiveBanner";

type AppShellProps = {
  children: ReactNode;
  /** Extra classes on the page root (e.g. studio-page) */
  className?: string;
  /** Extra classes on &lt;main&gt; (e.g. auth-form-wrap) */
  mainClassName?: string;
  footer?: boolean;
  narrow?: boolean;
  wide?: boolean;
  center?: boolean;
};

export default function AppShell({
  children,
  className,
  mainClassName,
  footer = true,
  narrow,
  wide,
  center,
}: AppShellProps) {
  const mainClasses = [
    "q-main",
    narrow && "q-main-narrow",
    wide && "q-main-wide",
    center && "q-main-center",
    mainClassName,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={["q-app", className].filter(Boolean).join(" ")}>
      <SiteNav variant="marketing" />
      <FollowingLiveBanner />
      <main className={mainClasses}>{children}</main>
      {footer ? <QFooter /> : null}
    </div>
  );
}
