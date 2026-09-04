/**
 * FairFill's brand mark — no logo asset was provided, so this is a
 * distinctive SVG mark built to the app's own design language (accent
 * indigo, geometric, restrained) rather than a generic icon substitute.
 * The glyph is a simplified balance beam sitting inside a rounded square:
 * two arcs in equilibrium around a center pin, reading "equity" at a glance.
 * Swap the <svg> below for a real asset whenever one is supplied — every
 * call site (splash, login, sidebar, NGO header) goes through this one
 * component, so the mark only needs to change in one place.
 */

const SIZE_MAP = {
  sm: { box: 28, glyph: 15, radius: 8 },
  md: { box: 40, glyph: 21, radius: 11 },
  lg: { box: 64, glyph: 34, radius: 16 },
} as const;

export function LogoMark({ size = 'md', className = '' }: { size?: keyof typeof SIZE_MAP; className?: string }) {
  const { box, glyph, radius } = SIZE_MAP[size];
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-accent-600 text-white shadow-card ${className}`}
      style={{ width: box, height: box, borderRadius: radius }}
    >
      <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3v15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M4 8h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path
          d="M4 8c0 2.4 1.79 4.3 4 4.3S12 10.4 12 8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 8c0 2.4 1.79 4.3 4 4.3S20 10.4 20 8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M8 20.5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 18v2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function Logo({
  size = 'md',
  withWordmark = true,
  className = '',
}: {
  size?: keyof typeof SIZE_MAP;
  withWordmark?: boolean;
  className?: string;
}) {
  const nameSize = size === 'lg' ? 'text-[26px]' : size === 'sm' ? 'text-[14px]' : 'text-[18px]';
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {withWordmark && <span className={`font-semibold tracking-tight text-stone-900 ${nameSize}`}>FairFill</span>}
    </div>
  );
}
