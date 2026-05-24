interface QLogoProps {
  size?: number;
  className?: string;
  alt?: string;
}

/** Brand mark — vinyl Q logo. */
export default function QLogo({ size = 36, className = "", alt = "Q" }: QLogoProps) {
  return (
    <img
      src="/q-logo.png"
      width={size}
      height={size}
      alt={alt}
      className={`q-logo ${className}`.trim()}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        maxWidth: `${size}px`,
        maxHeight: `${size}px`,
      }}
      draggable={false}
    />
  );
}
