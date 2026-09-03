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
        <h2 className="text-[14px] font-semibold text-stone-900">Allocation comparison</h2>
        <span className="label-caps">Illustrative comparison using current demo scenario</span>
      </div>
      <p className="mt-1 text-[12.5px] text-stone-500">
        A naive impact-only allocator funds the highest raw impact-per-rupee projects nationwide with no regional
        fairness constraint. FairFill's actual allocation is shown alongside it.
      </p>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E7E5E4" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#78716c', fontSize: 11 }} axisLine={{ stroke: '#E7E5E4' }} tickLine={false} />
            <YAxis
              tick={{ fill: '#78716c', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatINR(v, { compact: true })}
            />
            <Tooltip
              formatter={(v: number) => formatINR(v)}
              contentStyle={{ background: '#ffffff', border: '1px solid #E7E5E4', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#1c1917', fontWeight: 600 }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: '#57534e' }} />
            <Bar dataKey="Impact-only (traditional)" fill="#D6D3D1" radius={[3, 3, 0, 0]} />
            <Bar dataKey="FairFill (fairness + equity + impact)" fill="#4c5bc7" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
