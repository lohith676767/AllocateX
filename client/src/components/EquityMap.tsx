import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatINR, formatPct } from '../lib/format';
import type { Region } from '../types';

/**
 * Stylized prototype visualization — NOT a real geographic map. Regions are
 * laid out as proportionally-sized tiles; size reflects population, color
 * reflects underservice, and the ring reflects geographical equity score.
 */
export default function EquityMap({ regions }: { regions: Region[] }) {
  const navigate = useNavigate();
  const maxPop = Math.max(...regions.map((r) => r.population), 1);

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-mist-100">Regional Equity Map</h2>
        <span className="rounded-full border border-ink-600 px-2 py-0.5 text-[10px] uppercase tracking-wider text-mist-400">
          Prototype visualization — not GIS data
        </span>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {regions.map((r, i) => {
          const size = 64 + (r.population / maxPop) * 40;
          const underserviceHue = 152 - r.underserviceScore * 152; // teal(high service) -> red(underserved)
          return (
            <motion.button
              key={r.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => navigate(`/regions/${r.id}`)}
              className="group flex flex-col items-center gap-2 rounded-xl border border-ink-700 bg-ink-800/40 p-4 text-center transition-colors hover:border-signal-teal/40 hover:bg-ink-800"
            >
              <div
                className="flex items-center justify-center rounded-2xl border-2 font-mono text-[10px] font-semibold text-ink-950"
                style={{
                  width: size,
                  height: size,
                  background: `hsl(${underserviceHue}, 70%, 55%)`,
                  borderColor: `hsl(${underserviceHue}, 70%, 40%)`,
                }}
              >
                {formatPct(r.geographicalEquityScore * 100)}
              </div>
              <p className="text-xs font-semibold text-mist-100 group-hover:text-signal-teal">{r.name}</p>
              <p className="text-[10px] text-mist-400">{r.state}</p>
              <p className="text-[10px] text-mist-400">
                Underservice {formatPct(r.underserviceScore * 100)} · {formatINR(r.allocatedAmount, { compact: true })} allocated
              </p>
            </motion.button>
          );
        })}
      </div>
      <p className="mt-4 text-[10px] text-mist-400">
        Tile size ≈ population · Color ≈ underservice (red = higher) · Ring label = geographical equity score. Click a region to
        inspect its evidence.
      </p>
    </div>
  );
}
