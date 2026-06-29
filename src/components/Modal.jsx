import { useState, useEffect } from 'react';

export default function Modal({ config, onClose, onConfirm }) {
  const [recatValue, setRecatValue] = useState('');

  useEffect(() => {
    if (config?.alternatives?.length) {
      setRecatValue(config.alternatives[0].name);
    }
  }, [config]);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (config) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [config, onClose]);

  if (!config) return <div className="modal-overlay" />;

  const { action, title, body, alternatives } = config;

  function handleConfirm() {
    if (action === 'recategorize') {
      onConfirm(recatValue);
    } else {
      onConfirm();
    }
  }

  return (
    <div
      className={`modal-overlay${config ? ' open' : ''}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal">
        <h2>{title}</h2>
        <p>{body}</p>
        {action === 'recategorize' && alternatives && (
          <div className="modal-recat">
            <label htmlFor="recatSelect">Reasignar movimientos a:</label>
            <select
              id="recatSelect"
              value={recatValue}
              onChange={(e) => setRecatValue(e.target.value)}
            >
              {alternatives.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="modal-btns">
          <button className="btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="btn-confirm" onClick={handleConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}
