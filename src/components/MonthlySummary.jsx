import { useState, useMemo } from 'react';
import { getYearMonth, monthLabel, formatCurrency } from '../lib/helpers';

function BarChart({ groups, total, type }) {
  const entries = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  return entries.map(([cat, amt]) => {
    const pct = total > 0 ? (amt / total * 100).toFixed(1) : 0;
    return (
      <div className="cat-bar-row" key={cat}>
        <div className="cat-bar-label">{cat}</div>
        <div className="cat-bar-track">
          <div className={`cat-bar-fill ${type}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="cat-bar-amount">{formatCurrency(amt)}</div>
      </div>
    );
  });
}

export default function MonthlySummary({ transactions }) {
  const months = useMemo(() => {
    const set = [...new Set(transactions.map(t => getYearMonth(t.date)))].sort().reverse();
    const now = new Date();
    const curYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (!set.includes(curYM)) set.unshift(curYM);
    return set;
  }, [transactions]);

  const [selectedMonth, setSelectedMonth] = useState('');

  const ym = selectedMonth || months[0] || '';
  const txs = transactions.filter(t => getYearMonth(t.date) === ym);

  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  function groupBy(list) {
    return list.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});
  }

  const incCats = groupBy(txs.filter(t => t.type === 'income'));
  const expCats = groupBy(txs.filter(t => t.type === 'expense'));

  return (
    <>
      <p className="section-title">Resumen Mensual</p>
      <div className="monthly-card">
        <div className="month-selector">
          <select
            value={ym}
            onChange={e => setSelectedMonth(e.target.value)}
          >
            {months.map(m => (
              <option key={m} value={m}>{monthLabel(m)}</option>
            ))}
          </select>
        </div>

        {txs.length === 0 ? (
          <div className="empty-month">Sin movimientos en {monthLabel(ym)}</div>
        ) : (
          <div>
            <div className="monthly-totals">
              <div className="monthly-stat income">
                <div className="stat-label">Ingresos</div>
                <div className="stat-value">{formatCurrency(income)}</div>
              </div>
              <div className="monthly-stat expense">
                <div className="stat-label">Gastos</div>
                <div className="stat-value">{formatCurrency(expense)}</div>
              </div>
            </div>
            {Object.keys(incCats).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="cat-title">Ingresos por categoría</div>
                <BarChart groups={incCats} total={income} type="income" />
              </div>
            )}
            {Object.keys(expCats).length > 0 && (
              <div>
                <div className="cat-title">Gastos por categoría</div>
                <BarChart groups={expCats} total={expense} type="expense" />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
