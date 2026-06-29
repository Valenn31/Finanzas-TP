import { useState } from 'react';
import { useToast } from './Toast';

export default function Categories({ categories, transactions, onAdd, onDelete }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('income');
  const showToast = useToast();

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) { showToast('⚠️ Escribí un nombre'); return; }

    const allNames = (categories[type] || []).map(c => c.name.toLowerCase());
    if (allNames.includes(trimmed.toLowerCase())) { showToast('⚠️ Esa categoría ya existe'); return; }

    const result = await onAdd(trimmed, type);
    if (result?.error) {
      showToast('❌ Error al guardar');
      console.error(result.error);
      return;
    }

    setName('');
    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    showToast(`✅ Categoría "${formatted}" agregada`);
  }

  function handleDelete(catId, catName, catType) {
    const affected = transactions.filter(t => t.type === catType && t.category === catName);
    if (affected.length > 0) {
      const otherCats = categories[catType].filter(c => c.id !== catId);
      if (otherCats.length === 0) {
        showToast('⚠️ No podés eliminar la única categoría de este tipo');
        return;
      }
      onDelete(catId, catName, catType, affected.length, otherCats);
    } else {
      onDelete(catId, catName, catType, 0, null);
    }
  }

  function renderColumn(colType) {
    const cats = categories[colType] || [];
    const label = colType === 'income' ? 'Income' : 'Expense';
    const arrow = colType === 'income' ? '▲ Ingresos' : '▼ Gastos';

    return (
      <div className="cat-panel-col">
        <div className={`cat-panel-header ${colType}`}>
          <span>{arrow}</span>
          <span className="cat-count">{cats.length}</span>
        </div>
        <ul className="cat-list">
          {cats.length === 0 ? (
            <li style={{ padding: 12, color: 'var(--text-muted)', fontSize: '.82rem', textAlign: 'center' }}>
              Sin categorías
            </li>
          ) : (
            cats.map(cat => {
              const usageCount = transactions.filter(t => t.type === colType && t.category === cat.name).length;
              return (
                <li className="cat-item" key={cat.id}>
                  <span className="cat-item-name">{cat.name}</span>
                  <span className="cat-item-count">{usageCount} mov.</span>
                  <button
                    className="cat-delete-btn"
                    onClick={() => handleDelete(cat.id, cat.name, colType)}
                    title="Eliminar categoría"
                  >✕</button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    );
  }

  return (
    <>
      <p className="section-title">Gestión de Categorías</p>
      <div className="form-card">
        <div className="form-grid cat-form-grid">
          <div className="form-group">
            <label htmlFor="newCatName">Nombre</label>
            <input
              type="text"
              id="newCatName"
              placeholder="Ej: Freelance, Mascota…"
              maxLength="40"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="newCatType">Tipo</label>
            <select id="newCatType" value={type} onChange={e => setType(e.target.value)}>
              <option value="income">Ingreso</option>
              <option value="expense">Gasto</option>
            </select>
          </div>
          <button className="btn-submit full-col" onClick={handleAdd}>+ Agregar categoría</button>
        </div>
      </div>
      <div className="cat-panels">
        {renderColumn('income')}
        {renderColumn('expense')}
      </div>
    </>
  );
}
