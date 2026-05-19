import HeroScrollFrames from "./HeroScrollFrames";

type Props = {
  progress: number;
};

/** Fixed full-viewport deck animation — stays behind page content while scrolling. */
export default function HeroDeckBackdrop({ progress }: Props) {
  const deckLift = `${(1 - progress) * 6 - progress * 20}vh`;

  return (
    <div className="hero-deck-fixed" aria-hidden>
      <div className="hero-deck-backdrop">
        <div className="hero-deck-stage" style={{ transform: `translate3d(0, ${deckLift}, 0)` }}>
          <HeroScrollFrames progress={progress} />
        </div>
      </div>

      <div className="hero-gradient-fade" />
      <div className="hero-gradient-left" />
      <div className="hero-gradient-vignette" />

      <p className="hero-deck-label" style={{ opacity: Math.max(0.35, 1 - progress * 1.2) }}>
        Scroll · deck animation
      </p>
    </div>
  );
}
