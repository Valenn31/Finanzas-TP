import { formatCurrency } from '../lib/helpers';
import TransactionForm from './TransactionForm';
import MonthlySummary from './MonthlySummary';
import MonthlyChart from './MonthlyChart';

export default function Dashboard({ transactions, categories, onAddTransaction }) {
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;

  const balanceClass = balance >= 0 ? 'balance-positive' : 'balance-negative';
  const balanceSub = transactions.length === 0
    ? 'Sin movimientos registrados'
    : balance >= 0
      ? `Superávit de ${formatCurrency(balance)}`
      : `Déficit de ${formatCurrency(Math.abs(balance))}`;

  return (
    <>
      <div className="dashboard">
        <div className="card card-balance">
          <div className="card-label">Balance Neto</div>
          <div className={`card-value ${balanceClass}`}>
            {(balance < 0 ? '-' : '') + formatCurrency(balance)}
          </div>
          <div className="card-sub">{balanceSub}</div>
        </div>
        <div className="card card-income">
          <div className="card-label">Total Ingresos</div>
          <div className="card-value">{formatCurrency(income)}</div>
        </div>
        <div className="card card-expense">
          <div className="card-label">Total Gastos</div>
          <div className="card-value">{formatCurrency(expense)}</div>
        </div>
      </div>

      <TransactionForm categories={categories} onAdd={onAddTransaction} />
      <MonthlyChart transactions={transactions} />
      <MonthlySummary transactions={transactions} />
    </>
  );
}
