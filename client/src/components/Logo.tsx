/**
 * FairFill's brand mark. The attached reference (magnifying glass over a
 * rising bar chart with an upward arrow, navy + orange) came through as a
 * stock-site preview tiled with visible "Design.com" watermarks — not a
 * usable clean asset — so this is an original recreation of the same
 * concept as inline SVG rather than a shipped watermarked image. Every call
 * site (splash, login, sidebar, NGO header) renders through this one
 * component, so dropping in the real purchased file later only means
 * changing it here.
 */

const SIZE_MAP = {
  sm: { box: 28, glyph: 17 },
  md: { box: 40, glyph: 24 },
  lg: { box: 64, glyph: 38 },
} as const;

export function LogoMark({ size = 'md', className = '' }: { size?: keyof typeof SIZE_MAP; className?: string }) {
  const { box, glyph } = SIZE_MAP[size];
  return (
    <div className={`flex shrink-0 items-center justify-center ${className}`} style={{ width: box, height: box }}>
      <svg width={glyph} height={glyph} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="19" stroke="#1f6fa8" strokeWidth="2" fill="#f7f9fb" />
        {/* rising bars */}
        <rect x="13.5" y="20" width="3.4" height="8" rx="0.6" fill="#425873" />
        <rect x="18.3" y="15.5" width="3.4" height="12.5" rx="0.6" fill="#f0871f" />
        <rect x="23.1" y="18" width="3.4" height="10" rx="0.6" fill="#425873" />
        {/* upward arrow sweeping over the bars */}
        <path
          d="M11 24c3-6 6-8 9-6.5s5.5 1 9-6.5"
          stroke="#1f6fa8"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M25.5 9.5l3.3 1-1 3.3" stroke="#1f6fa8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* magnifying glass */}
        <circle cx="19" cy="21" r="8.6" stroke="#1f6fa8" strokeWidth="2.2" fill="none" />
        <line x1="25.2" y1="27.2" x2="30.5" y2="32.5" stroke="#1f6fa8" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function Logo({
  size = 'md',
  withWordmark = true,
  light = false,
  className = '',
}: {
  size?: keyof typeof SIZE_MAP;
  withWordmark?: boolean;
  /** Use on dark surfaces (e.g. the navy sidebar) so the wordmark stays legible. */
  light?: boolean;
  className?: string;
}) {
  const nameSize = size === 'lg' ? 'text-[26px]' : size === 'sm' ? 'text-[14px]' : 'text-[18px]';
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {withWordmark && (
        <span className={`font-bold tracking-tight ${nameSize} ${light ? 'text-white' : 'text-[#1f6fa8]'}`}>FAIRFILL</span>
      )}
    </div>
  );
}
