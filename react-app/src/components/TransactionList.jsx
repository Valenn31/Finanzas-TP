import { useState } from 'react';
import { formatCurrency } from '../lib/helpers';
import { useToast } from './Toast';

export default function TransactionList({ transactions, onDelete, onClearAll }) {
  const [filterType, setFilterType] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');
  const showToast = useToast();

  let list = [...transactions];
  if (filterType !== 'all') list = list.filter(t => t.type === filterType);
  if (filterSearch) {
    const s = filterSearch.toLowerCase();
    list = list.filter(t =>
      t.category.toLowerCase().includes(s) ||
      (t.obs && t.obs.toLowerCase().includes(s))
    );
  }

  async function handleDelete(id) {
    const result = await onDelete(id);
    if (result?.error) {
      showToast('❌ Error al eliminar');
      console.error(result.error);
    } else {
      showToast('🗑 Movimiento eliminado');
    }
  }

  return (
    <>
      <p className="section-title">Todos los Movimientos</p>
      <div className="list-controls">
        <select value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="all">Todos los tipos</option>
          <option value="income">Solo ingresos</option>
          <option value="expense">Solo gastos</option>
        </select>
        <input
          type="text"
          placeholder="Buscar…"
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
        />
      </div>
      <div className="tx-list">
        {list.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <div>
              {transactions.length === 0
                ? 'Aún no hay movimientos. ¡Cargá el primero!'
                : 'Sin resultados para ese filtro.'}
            </div>
          </div>
        ) : (
          list.map(t => {
            const sign = t.type === 'income' ? '+' : '-';
            const dateF = new Date(t.date + 'T12:00:00').toLocaleDateString('es-AR', {
              day: '2-digit', month: 'short', year: 'numeric',
            });
            return (
              <div className="tx-item" key={t.id}>
                <div className={`tx-stripe ${t.type}`} />
                <div className="tx-info">
                  <div className="tx-header">
                    <span className="tx-category">{t.category}</span>
                    <span className="tx-date">{dateF}</span>
                  </div>
                  {t.obs && <div className="tx-obs">{t.obs}</div>}
                </div>
                <div className={`tx-amount ${t.type}`}>{sign}{formatCurrency(t.amount)}</div>
                <button className="tx-delete" onClick={() => handleDelete(t.id)} title="Eliminar">🗑</button>
              </div>
            );
          })
        )}
      </div>
      <div className="danger-zone">
        <button className="btn-clear" onClick={onClearAll}>🗑 Eliminar todos los registros</button>
      </div>
    </>
  );
}
