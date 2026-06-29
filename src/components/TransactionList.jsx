import { useState } from 'react';
import { formatCurrency } from '../lib/helpers';
import { exportToCsv } from '../lib/exportCsv';
import { useToast } from './Toast';

export default function TransactionList({ transactions, categories, onDelete, onUpdate, onClearAll }) {
  const [filterType, setFilterType] = useState('all');
  const [filterSearch, setFilterSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
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
  if (dateFrom) list = list.filter(t => t.date >= dateFrom);
  if (dateTo) list = list.filter(t => t.date <= dateTo);
  if (amountMin) list = list.filter(t => Number(t.amount) >= parseFloat(amountMin));
  if (amountMax) list = list.filter(t => Number(t.amount) <= parseFloat(amountMax));

  async function handleDelete(id) {
    const result = await onDelete(id);
    if (result?.error) {
      showToast('❌ Error al eliminar');
    } else {
      showToast('🗑 Movimiento eliminado');
    }
  }

  function startEdit(t) {
    setEditingId(t.id);
    setEditForm({
      type: t.type,
      amount: t.amount,
      date: t.date,
      category: t.category,
      obs: t.obs || '',
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function saveEdit(id) {
    const amt = parseFloat(editForm.amount);
    if (!amt || amt <= 0) { showToast('⚠️ Monto inválido'); return; }
    if (!editForm.date) { showToast('⚠️ Fecha requerida'); return; }

    const result = await onUpdate(id, {
      type: editForm.type,
      amount: parseFloat(amt.toFixed(2)),
      date: editForm.date,
      category: editForm.category,
      obs: editForm.obs || null,
    });

    if (result?.error) {
      showToast('❌ Error al guardar');
    } else {
      showToast('✅ Movimiento actualizado');
      setEditingId(null);
      setEditForm({});
    }
  }

  function handleExport() {
    if (list.length === 0) {
      showToast('⚠️ No hay movimientos para exportar');
      return;
    }
    exportToCsv(list);
    showToast('✅ CSV descargado');
  }

  function clearFilters() {
    setFilterType('all');
    setFilterSearch('');
    setDateFrom('');
    setDateTo('');
    setAmountMin('');
    setAmountMax('');
  }

  const hasFilters = filterType !== 'all' || filterSearch || dateFrom || dateTo || amountMin || amountMax;
  const editCatNames = editForm.type ? (categories[editForm.type] || []) : [];

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
        <button
          className={`btn-filter-toggle${showAdvanced ? ' active' : ''}`}
          onClick={() => setShowAdvanced(!showAdvanced)}
          title="Filtros avanzados"
        >⚙ Filtros</button>
      </div>

      {showAdvanced && (
        <div className="advanced-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Desde</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>Hasta</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>Monto mín.</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={amountMin} onChange={e => setAmountMin(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>Monto máx.</label>
              <input type="number" min="0" step="0.01" placeholder="∞" value={amountMax} onChange={e => setAmountMax(e.target.value)} />
            </div>
          </div>
          {hasFilters && (
            <button className="btn-clear-filters" onClick={clearFilters}>✕ Limpiar filtros</button>
          )}
        </div>
      )}

      <div className="list-actions">
        <span className="list-count">{list.length} movimiento{list.length !== 1 ? 's' : ''}</span>
        <button className="btn-export" onClick={handleExport} title="Exportar a CSV">📥 Exportar CSV</button>
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
            if (editingId === t.id) {
              return (
                <div className="tx-item tx-editing" key={t.id}>
                  <div className={`tx-stripe ${editForm.type}`} />
                  <div className="tx-edit-form">
                    <div className="edit-row">
                      <select value={editForm.type} onChange={e => {
                        const newType = e.target.value;
                        const newCats = categories[newType] || [];
                        setEditForm(f => ({ ...f, type: newType, category: newCats[0]?.name || '' }));
                      }}>
                        <option value="income">Ingreso</option>
                        <option value="expense">Gasto</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.amount}
                        onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                      />
                      <input
                        type="date"
                        value={editForm.date}
                        onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                      />
                    </div>
                    <div className="edit-row">
                      <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}>
                        {editCatNames.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Observaciones…"
                        value={editForm.obs}
                        onChange={e => setEditForm(f => ({ ...f, obs: e.target.value }))}
                      />
                    </div>
                    <div className="edit-actions">
                      <button className="btn-edit-save" onClick={() => saveEdit(t.id)}>✓ Guardar</button>
                      <button className="btn-edit-cancel" onClick={cancelEdit}>✕ Cancelar</button>
                    </div>
                  </div>
                </div>
              );
            }

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
                <button className="tx-edit" onClick={() => startEdit(t)} title="Editar">✏️</button>
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
