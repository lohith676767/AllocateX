import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { formatINR, formatPct } from '../lib/format';
import type { Region } from '../types';

/**
 * A hand-drawn, deliberately simplified India outline (equirectangular
 * projection, straight-line vertices) — a stylized prototype map, not
 * survey-grade GIS data. Good enough to place four regional pins in
 * roughly correct relative positions without pulling in a mapping library.
 */
const INDIA_OUTLINE =
  'M1.7,43.5 L3.4,51.6 L16.6,58.1 L20,69.7 L28.3,87.1 L32.8,93.2 L39,89.4 L42.1,77.4 ' +
  'L52.8,62.3 L61.4,55.5 L70.7,50 L79.3,48.4 L100,29 L82.8,33.9 L70.7,33.9 L48.3,29 ' +
  'L37.9,21 L27.6,12.9 L31,6.5 L22.4,16.1 L6.9,29 L3.4,41.9 Z';

// Approximate relative positions (equirectangular lon/lat projected to a 0-100
// box) for the seeded regions — presentational placement only, not GIS data
// and not sourced from the backend.
const REGION_COORDS: Record<string, { x: number; y: number }> = {
  Bundelkhand: { x: 39.7, y: 37.7 },
  Vidarbha: { x: 38.2, y: 51.1 },
  'Coastal Odisha': { x: 61.4, y: 54.2 },
  'North Bengaluru Urban': { x: 33.1, y: 77.3 },
};

function heatColor(underserviceScore: number) {
  // Same single warm ramp used by the equity tile map — no rainbow hues.
  const t = underserviceScore;
  return {
    fill: `rgba(190, 60, 50, ${0.5 + t * 0.4})`,
    ring: `rgba(190, 60, 50, ${0.35 + t * 0.35})`,
  };
}

export default function IndiaRegionMap({
  regions,
  onSelectRegion,
}: {
  regions: Region[];
  onSelectRegion: (regionId: string) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const pins = regions.filter((r) => REGION_COORDS[r.name]);

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[14px] font-semibold text-stone-900">Regional map</h2>
        <span className="label-caps">Stylized prototype visualization — not GIS data</span>
      </div>
      <p className="mt-1 text-[12px] text-stone-500">Hover a pin for key metrics, click to open its full detail.</p>

      <div className="relative mx-auto mt-5 aspect-square w-full max-w-md">
        <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible">
          <path d={INDIA_OUTLINE} fill="#F5F5F4" stroke="#D6D3D1" strokeWidth={1} strokeLinejoin="round" />
        </svg>

        {pins.map((r, i) => {
          const coord = REGION_COORDS[r.name];
          const { fill, ring } = heatColor(r.underserviceScore);
          const isHovered = hoveredId === r.id;
          return (
            <button
              key={r.id}
              onClick={() => onSelectRegion(r.id)}
              onMouseEnter={() => setHoveredId(r.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(r.id)}
              onBlur={() => setHoveredId(null)}
              aria-label={`${r.name} — open region detail`}
              className="group absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center outline-none"
              style={{ left: `${coord.x}%`, top: `${coord.y}%` }}
            >
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 260, damping: 18 }}
                className="relative flex h-6 w-6 items-center justify-center"
              >
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full"
                  style={{ backgroundColor: ring }}
                />
                <span
                  className="relative inline-flex h-3 w-3 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125"
                  style={{ backgroundColor: fill }}
                />
              </motion.span>

              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-44 -translate-x-1/2 rounded-lg border border-stone-200 bg-white p-3 text-left shadow-popover"
                  >
                    <p className="text-[12px] font-semibold text-stone-900">{r.name}</p>
                    <p className="text-[10.5px] text-stone-400">{r.state}</p>
                    <dl className="mt-2 space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <dt className="text-stone-500">Underservice</dt>
                        <dd className="tabular-nums font-medium text-rose-600">{formatPct(r.underserviceScore * 100)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-stone-500">Equity</dt>
                        <dd className="tabular-nums font-medium text-accent-600">{formatPct(r.geographicalEquityScore * 100)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-stone-500">Allocated</dt>
                        <dd className="tabular-nums font-medium text-stone-800">{formatINR(r.allocatedAmount, { compact: true })}</dd>
                      </div>
                    </dl>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </div>
  );
}
