import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getYearMonth, monthLabel } from '../lib/helpers';

export default function MonthlyChart({ transactions }) {
  const data = useMemo(() => {
    const monthMap = {};

    transactions.forEach(t => {
      const ym = getYearMonth(t.date);
      if (!monthMap[ym]) monthMap[ym] = { month: ym, Ingresos: 0, Gastos: 0 };
      if (t.type === 'income') monthMap[ym].Ingresos += Number(t.amount);
      else monthMap[ym].Gastos += Number(t.amount);
    });

    return Object.values(monthMap)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map(d => ({
        ...d,
        label: monthLabel(d.month).replace(/^\w/, c => c.toUpperCase()),
      }));
  }, [transactions]);

  if (data.length === 0) {
    return (
      <>
        <p className="section-title">Evolución Mensual</p>
        <div className="monthly-card">
          <div className="empty-month">Sin datos para el gráfico</div>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="section-title">Evolución Mensual</p>
      <div className="monthly-card">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: '#8B90A8', fontSize: 11 }}
              axisLine={{ stroke: '#2A2D3E' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#8B90A8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 13,
                color: 'var(--text)',
              }}
              formatter={(value) => [`$${Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, undefined]}
              labelStyle={{ color: 'var(--text-muted)', marginBottom: 4 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)' }}
            />
            <Bar dataKey="Ingresos" fill="#00D4AA" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Gastos" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
