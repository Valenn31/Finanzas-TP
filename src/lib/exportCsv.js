export function exportToCsv(transactions, filename = 'fintrack-movimientos.csv') {
  if (transactions.length === 0) return false;

  const headers = ['Fecha', 'Tipo', 'Categoría', 'Monto', 'Observaciones'];
  const rows = transactions.map(t => [
    t.date,
    t.type === 'income' ? 'Ingreso' : 'Gasto',
    t.category,
    t.amount,
    t.obs || '',
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const bom = '﻿';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
