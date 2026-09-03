import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatINR } from '../lib/format';
import type { ComparisonRow } from '../types';

export default function ComparisonChart({ rows }: { rows: ComparisonRow[] }) {
  const data = rows.map((r) => ({
    name: r.name,
    'Impact-only (traditional)': r.traditionalAmount,
    'FairFill (fairness + equity + impact)': r.fairfillAmount,
  }));

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-mist-100">Allocation comparison</h2>
        <span className="text-[10px] uppercase tracking-wider text-mist-400">Illustrative comparison using current demo scenario</span>
      </div>
      <p className="mt-1 text-xs text-mist-400">
        A naive impact-only allocator funds the highest raw impact-per-rupee projects nationwide with no regional
        fairness constraint. FairFill's actual allocation is shown alongside it.
      </p>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a2333" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#7c8aa5', fontSize: 11 }} axisLine={{ stroke: '#26324a' }} tickLine={false} />
            <YAxis
              tick={{ fill: '#7c8aa5', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatINR(v, { compact: true })}
            />
            <Tooltip
              formatter={(v: number) => formatINR(v)}
              contentStyle={{ background: '#111826', border: '1px solid #26324a', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#e4e8f0' }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#9fabc2' }} />
            <Bar dataKey="Impact-only (traditional)" fill="#3a4a68" radius={[4, 4, 0, 0]} />
            <Bar dataKey="FairFill (fairness + equity + impact)" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
