import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatINR, formatPct } from '../lib/format';
import type { Region } from '../types';

/**
 * Stylized prototype visualization — NOT a real geographic map. Tile
 * intensity (a single warm ramp, not a rainbow) reflects underservice;
 * the percentage is the geographical equity score.
 */
export default function EquityMap({ regions }: { regions: Region[] }) {
  const navigate = useNavigate();

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[14px] font-semibold text-stone-900">Regional equity map</h2>
        <span className="label-caps">Prototype visualization — not GIS data</span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {regions.map((r, i) => {
          const t = r.underserviceScore; // 0..1 heat intensity
          const bg = `rgba(190, 60, 50, ${0.06 + t * 0.34})`;
          const border = `rgba(190, 60, 50, ${0.16 + t * 0.34})`;
          return (
            <motion.button
              key={r.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/regions/${r.id}`)}
              className="group flex flex-col gap-2.5 rounded-lg border border-stone-200 p-4 text-left transition-colors hover:border-accent-300"
            >
              <div
                className="flex h-14 items-center justify-center rounded-md border font-mono text-[13px] font-semibold text-stone-800"
                style={{ background: bg, borderColor: border }}
              >
                {formatPct(r.geographicalEquityScore * 100)}
              </div>
              <div>
                <p className="text-[12.5px] font-semibold text-stone-900 group-hover:text-accent-700">{r.name}</p>
                <p className="text-[11px] text-stone-500">{r.state}</p>
              </div>
              <p className="text-[11px] text-stone-500">
                Underservice {formatPct(r.underserviceScore * 100)} &middot; {formatINR(r.allocatedAmount, { compact: true })} allocated
              </p>
            </motion.button>
          );
        })}
      </div>
      <p className="mt-4 text-[11px] text-stone-400">
        Tile intensity ≈ underservice (deeper = higher need) &middot; Percentage = geographical equity score. Click a
        region to inspect its evidence.
      </p>
    </div>
  );
}
