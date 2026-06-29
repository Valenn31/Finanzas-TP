import { useState } from 'react';
import { getTodayStr } from '../lib/helpers';
import { useToast } from './Toast';

export default function TransactionForm({ categories, onAdd }) {
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayStr());
  const [category, setCategory] = useState('');
  const [obs, setObs] = useState('');
  const showToast = useToast();

  const cats = categories[type] || [];
  const catNames = cats.map(c => c.name);

  async function handleSubmit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { showToast('⚠️ Ingresá un monto válido'); return; }
    if (!date) { showToast('⚠️ Seleccioná una fecha'); return; }
    const cat = category || catNames[0] || '';
    if (!cat) { showToast('⚠️ Seleccioná una categoría'); return; }

    const result = await onAdd({
      type,
      amount: parseFloat(amt.toFixed(2)),
      date,
      category: cat,
      obs: obs || null,
    });

    if (result?.error) {
      showToast('❌ Error al guardar');
      console.error(result.error);
      return;
    }

    setAmount('');
    setObs('');
    setDate(getTodayStr());
    showToast(type === 'income' ? '✅ Ingreso guardado' : '✅ Gasto guardado');
  }

  return (
    <>
      <p className="section-title">Nuevo Movimiento</p>
      <div className="form-card">
        <div className="form-grid">
          <div className="form-group full">
            <label>Tipo</label>
            <div className="type-toggle">
              <button
                className={`type-btn${type === 'income' ? ' active-income' : ''}`}
                onClick={() => setType('income')}
              >▲ Ingreso</button>
              <button
                className={`type-btn${type === 'expense' ? ' active-expense' : ''}`}
                onClick={() => setType('expense')}
              >▼ Gasto</button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="amount">Monto</label>
            <input
              type="number"
              id="amount"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="date">Fecha</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">Categoría</label>
            <select
              id="category"
              value={category || catNames[0] || ''}
              onChange={e => setCategory(e.target.value)}
            >
              {cats.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group full">
            <label htmlFor="observations">Observaciones (opcional)</label>
            <textarea
              id="observations"
              placeholder="Ej: pago mensual, cuota 3/12…"
              value={obs}
              onChange={e => setObs(e.target.value)}
            />
          </div>
          <button className="btn-submit full-col" onClick={handleSubmit}>Guardar movimiento</button>
        </div>
      </div>
    </>
  );
}
