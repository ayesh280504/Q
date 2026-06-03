import type { ReactNode } from "react";
import QLogo from "./QLogo";

type Props = {
  kicker?: string;
  title: ReactNode;
  children?: ReactNode;
};

/** Shared header for crowd pages (request, redirect, fallback). */
export default function CrowdHero({ kicker, title, children }: Props) {
  return (
    <header className="crowd-hero">
      <QLogo size={48} className="brand-mark" />
      {kicker ? <p className="crowd-kicker">{kicker}</p> : null}
      <h1 className="crowd-title">{title}</h1>
      {children}
    </header>
  );
}
