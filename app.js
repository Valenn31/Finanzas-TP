/* =============================================
   app.js — FinTrack
   Lógica principal: auth, navegación, CRUD
   Depende de: supabase.js (debe cargarse antes)
============================================= */

/* ─────────────────────────────────────────
   ESTADO GLOBAL
───────────────────────────────────────── */
let currentUser       = null;
let transactions      = [];
let categories        = { income: [], expense: [] };
let currentType       = 'income';
let activeSection     = 'dashboard';

// Para el modal genérico
let modalAction       = null;
let modalMeta         = {};

/* ─────────────────────────────────────────
   CATEGORÍAS POR DEFECTO
   (se guardan en Supabase la primera vez)
───────────────────────────────────────── */
const DEFAULT_CATEGORIES = {
  income:  ['Salario', 'Ventas', 'Inversiones', 'Otros'],
  expense: ['Alimentación', 'Transporte', 'Servicios', 'Ocio', 'Salud', 'Otros'],
};

/* =============================================
   INIT — punto de entrada
============================================= */
async function init() {
  setTopbarDate();

  // Escucha cambios de sesión (login / logout / refresh)
  window.supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      currentUser = session.user;
      await onUserLoggedIn();
    } else {
      currentUser = null;
      showAuthScreen();
    }
  });
}

/* =============================================
   AUTENTICACIÓN
============================================= */
async function loginWithGoogle() {
  const { error } = await window.supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href },
  });
  if (error) showToast('❌ Error al iniciar sesión: ' + error.message);
}

async function logout() {
  await window.supabase.auth.signOut();
  // onAuthStateChange llama showAuthScreen automáticamente
}

function showAuthScreen() {
  document.getElementById('authScreen').classList.remove('hidden');
  document.getElementById('appScreen').classList.add('hidden');
  hideLoading();
}

function showAppScreen() {
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appScreen').classList.remove('hidden');
}

async function onUserLoggedIn() {
  showLoading();
  showAppScreen();
  fillUserUI();

  await ensureDefaultCategories();
  await loadAllData();

  hideLoading();
  navigateTo('dashboard');
}

function fillUserUI() {
  const meta = currentUser.user_metadata || {};
  document.getElementById('userName').textContent  = meta.full_name  || meta.name  || 'Usuario';
  document.getElementById('userEmail').textContent = currentUser.email || '';
  const avatar = meta.avatar_url || meta.picture || '';
  const img    = document.getElementById('userAvatar');
  if (avatar) {
    img.src = avatar;
  } else {
    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.full_name||'U')}&background=7B7FFF&color=fff`;
  }
}

/* =============================================
   LOADING
============================================= */
function showLoading() { document.getElementById('loadingOverlay').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loadingOverlay').classList.add('hidden'); }

/* =============================================
   DRAWER / NAVEGACIÓN
============================================= */
function openDrawer() {
  document.getElementById('drawer').classList.add('open');
  document.getElementById('drawerOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  document.getElementById('drawer').classList.remove('open');
  document.getElementById('drawerOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

const SECTION_TITLES = {
  dashboard:    'Dashboard',
  transactions: 'Movimientos',
  categories:   'Categorías',
};

function navigateTo(section) {
  activeSection = section;

  // Actualiza nav items
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === section);
  });

  // Muestra sección correcta
  document.querySelectorAll('.section').forEach(el => {
    el.classList.toggle('active', el.id === `section-${section}`);
  });

  // Título del topbar
  document.getElementById('topbarTitle').textContent = SECTION_TITLES[section] || section;

  closeDrawer();

  // Refresca la vista correspondiente
  if (section === 'dashboard')    { renderDashboard(); renderMonthlySummary(); }
  if (section === 'transactions') { renderList(); }
  if (section === 'categories')   { renderCategoryLists(); }
}

/* =============================================
   CARGA DE DATOS DESDE SUPABASE
============================================= */
async function loadAllData() {
  await Promise.all([loadCategories(), loadTransactions()]);
  populateMonthSelector();
  updateCategoryDropdown();
}

/* ─── Categorías ─── */
async function loadCategories() {
  const { data, error } = await window.supabase
    .from('categories')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: true });

  if (error) { console.error('loadCategories:', error); return; }

  categories = { income: [], expense: [] };
  (data || []).forEach(c => {
    if (categories[c.type]) categories[c.type].push({ id: c.id, name: c.name });
  });
}

/* ─── Transacciones ─── */
async function loadTransactions() {
  const { data, error } = await window.supabase
    .from('transactions')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) { console.error('loadTransactions:', error); return; }
  transactions = data || [];
}

/* ─── Crear categorías por defecto si el usuario es nuevo ─── */
async function ensureDefaultCategories() {
  const { count } = await window.supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', currentUser.id);

  if (count > 0) return; // ya tiene categorías

  const rows = [];
  ['income', 'expense'].forEach(type => {
    DEFAULT_CATEGORIES[type].forEach(name => {
      rows.push({ user_id: currentUser.id, name, type, is_default: true });
    });
  });

  await window.supabase.from('categories').insert(rows);
}

/* =============================================
   CATEGORÍAS — CRUD
============================================= */
function getAllCategoryNames(type) {
  return categories[type].map(c => c.name);
}

function updateCategoryDropdown() {
  const sel  = document.getElementById('category');
  const prev = sel.value;
  sel.innerHTML = '';
  getAllCategoryNames(currentType).forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    sel.appendChild(opt);
  });
  if ([...sel.options].some(o => o.value === prev)) sel.value = prev;
}

async function addCategory() {
  const nameInput = document.getElementById('newCatName');
  const typeInput = document.getElementById('newCatType');
  const name      = nameInput.value.trim();
  const type      = typeInput.value;

  if (!name) { showToast('⚠️ Escribí un nombre'); return; }

  const allNames = getAllCategoryNames(type).map(n => n.toLowerCase());
  if (allNames.includes(name.toLowerCase())) { showToast('⚠️ Esa categoría ya existe'); return; }

  const formatted = name.charAt(0).toUpperCase() + name.slice(1);

  const { data, error } = await window.supabase
    .from('categories')
    .insert({ user_id: currentUser.id, name: formatted, type, is_default: false })
    .select()
    .single();

  if (error) { showToast('❌ Error al guardar'); console.error(error); return; }

  categories[type].push({ id: data.id, name: data.name });
  nameInput.value = '';
  updateCategoryDropdown();
  renderCategoryLists();
  showToast(`✅ Categoría "${formatted}" agregada`);
}

async function deleteCategory(catId, catName, catType) {
  // ¿Cuántos movimientos usan esta categoría?
  const affected = transactions.filter(t => t.type === catType && t.category === catName);

  if (affected.length > 0) {
    // Pedir recategorización
    const otherCats = categories[catType].filter(c => c.id !== catId);
    if (otherCats.length === 0) {
      showToast('⚠️ No podés eliminar la única categoría de este tipo');
      return;
    }
    openModal('recategorize', {
      catId, catName, catType,
      affected: affected.length,
      alternatives: otherCats,
    });
  } else {
    // Sin movimientos → eliminar directo
    openModal('deleteCategory', { catId, catName, catType, affected: 0 });
  }
}

async function executeDeleteCategory(catId, catName, catType, newCatName) {
  // 1. Reasignar movimientos si aplica
  if (newCatName) {
    const { error: updateErr } = await window.supabase
      .from('transactions')
      .update({ category: newCatName })
      .eq('user_id', currentUser.id)
      .eq('type', catType)
      .eq('category', catName);
    if (updateErr) { showToast('❌ Error al reasignar movimientos'); console.error(updateErr); return; }
  }

  // 2. Eliminar la categoría
  const { error } = await window.supabase.from('categories').delete().eq('id', catId);
  if (error) { showToast('❌ Error al eliminar categoría'); console.error(error); return; }

  // 3. Actualizar estado local
  categories[catType] = categories[catType].filter(c => c.id !== catId);
  if (newCatName) {
    transactions.forEach(t => {
      if (t.type === catType && t.category === catName) t.category = newCatName;
    });
  }

  updateCategoryDropdown();
  renderCategoryLists();
  renderList();
  showToast(`🗑 Categoría "${catName}" eliminada`);
}

function renderCategoryLists() {
  renderCatColumn('income');
  renderCatColumn('expense');
}

function renderCatColumn(type) {
  const listEl  = document.getElementById(`catList${type === 'income' ? 'Income' : 'Expense'}`);
  const countEl = document.getElementById(`catCount${type === 'income' ? 'Income' : 'Expense'}`);

  countEl.textContent = categories[type].length;
  listEl.innerHTML = '';

  if (categories[type].length === 0) {
    listEl.innerHTML = `<li style="padding:12px;color:var(--text-muted);font-size:.82rem;text-align:center">Sin categorías</li>`;
    return;
  }

  categories[type].forEach(cat => {
    const usageCount = transactions.filter(t => t.type === type && t.category === cat.name).length;
    listEl.insertAdjacentHTML('beforeend', `
      <li class="cat-item">
        <span class="cat-item-name">${escapeHtml(cat.name)}</span>
        <span class="cat-item-count">${usageCount} mov.</span>
        <button
          class="cat-delete-btn"
          onclick="deleteCategory('${cat.id}', '${escapeHtml(cat.name)}', '${type}')"
          title="Eliminar categoría"
        >✕</button>
      </li>
    `);
  });
}

/* =============================================
   TIPO DE MOVIMIENTO (toggle)
============================================= */
function setType(type) {
  currentType = type;
  document.getElementById('btnIncome').className  = 'type-btn' + (type === 'income'  ? ' active-income'  : '');
  document.getElementById('btnExpense').className = 'type-btn' + (type === 'expense' ? ' active-expense' : '');
  updateCategoryDropdown();
}

/* =============================================
   TRANSACCIONES — CRUD
============================================= */
async function addTransaction() {
  const amount = parseFloat(document.getElementById('amount').value);
  const date   = document.getElementById('date').value;
  const cat    = document.getElementById('category').value;
  const obs    = document.getElementById('observations').value.trim();

  if (!amount || amount <= 0) { showToast('⚠️ Ingresá un monto válido'); return; }
  if (!date)                  { showToast('⚠️ Seleccioná una fecha');     return; }
  if (!cat)                   { showToast('⚠️ Seleccioná una categoría'); return; }

  const row = {
    user_id:  currentUser.id,
    type:     currentType,
    amount:   parseFloat(amount.toFixed(2)),
    date,
    category: cat,
    obs:      obs || null,
  };

  const { data, error } = await window.supabase
    .from('transactions')
    .insert(row)
    .select()
    .single();

  if (error) { showToast('❌ Error al guardar'); console.error(error); return; }

  transactions.unshift(data);

  document.getElementById('amount').value = '';
  document.getElementById('observations').value = '';
  setTodayDate();

  populateMonthSelector();
  renderDashboard();
  renderMonthlySummary();

  showToast(currentType === 'income' ? '✅ Ingreso guardado' : '✅ Gasto guardado');
}

async function deleteTransaction(id) {
  const { error } = await window.supabase.from('transactions').delete().eq('id', id);
  if (error) { showToast('❌ Error al eliminar'); console.error(error); return; }

  transactions = transactions.filter(t => t.id !== id);
  populateMonthSelector();
  renderDashboard();
  renderMonthlySummary();
  renderList();
  showToast('🗑 Movimiento eliminado');
}

async function clearAllTransactions() {
  const { error } = await window.supabase
    .from('transactions')
    .delete()
    .eq('user_id', currentUser.id);
  if (error) { showToast('❌ Error al eliminar'); console.error(error); return; }

  transactions = [];
  populateMonthSelector();
  renderDashboard();
  renderMonthlySummary();
  renderList();
  showToast('🗑 Todos los registros eliminados');
}

/* =============================================
   MODAL GENÉRICO
============================================= */
function openModal(action, meta = {}) {
  modalAction = action;
  modalMeta   = meta;

  const title   = document.getElementById('modalTitle');
  const body    = document.getElementById('modalBody');
  const recat   = document.getElementById('modalRecat');
  const recatSel= document.getElementById('recatSelect');
  const overlay = document.getElementById('modalOverlay');

  recat.classList.add('hidden');

  if (action === 'clearAll') {
    title.textContent = '¿Eliminar todo?';
    body.textContent  = 'Se borrarán permanentemente todos tus movimientos. Esta acción no se puede deshacer.';
  }

  if (action === 'deleteCategory') {
    title.textContent = `¿Eliminar "${meta.catName}"?`;
    body.textContent  = 'Esta categoría no tiene movimientos asociados y se eliminará definitivamente.';
  }

  if (action === 'recategorize') {
    title.textContent = `¿Eliminar "${meta.catName}"?`;
    body.textContent  = `Tiene ${meta.affected} movimiento(s) asignado(s). Elegí a qué categoría reasignarlos:`;
    recatSel.innerHTML = meta.alternatives
      .map(c => `<option value="${escapeHtml(c.name)}">${escapeHtml(c.name)}</option>`)
      .join('');
    recat.classList.remove('hidden');
  }

  overlay.classList.add('open');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  modalAction = null;
  modalMeta   = {};
}

async function confirmModal() {
  closeModal();
  if (modalAction === 'clearAll') {
    await clearAllTransactions();
  }
  if (modalAction === 'deleteCategory') {
    await executeDeleteCategory(modalMeta.catId, modalMeta.catName, modalMeta.catType, null);
  }
  if (modalAction === 'recategorize') {
    const newCat = document.getElementById('recatSelect').value;
    await executeDeleteCategory(modalMeta.catId, modalMeta.catName, modalMeta.catType, newCat);
  }
}

/* =============================================
   DASHBOARD
============================================= */
function renderDashboard() {
  const income  = transactions.filter(t => t.type === 'income').reduce((s,t) => s + Number(t.amount), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s,t) => s + Number(t.amount), 0);
  const balance = income - expense;

  document.getElementById('cardIncome').textContent  = formatCurrency(income);
  document.getElementById('cardExpense').textContent = formatCurrency(expense);

  const balEl = document.getElementById('cardBalance');
  const subEl = document.getElementById('cardBalanceSub');
  balEl.textContent = (balance < 0 ? '-' : '') + formatCurrency(balance);
  balEl.className   = 'card-value ' + (balance >= 0 ? 'balance-positive' : 'balance-negative');
  subEl.textContent = transactions.length === 0
    ? 'Sin movimientos registrados'
    : balance >= 0
      ? `Superávit de ${formatCurrency(balance)}`
      : `Déficit de ${formatCurrency(Math.abs(balance))}`;
}

/* =============================================
   RESUMEN MENSUAL
============================================= */
function populateMonthSelector() {
  const months = [...new Set(transactions.map(t => getYearMonth(t.date)))].sort().reverse();
  const now    = new Date();
  const curYM  = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  if (!months.includes(curYM)) months.unshift(curYM);

  const sel  = document.getElementById('monthSelect');
  const prev = sel.value;
  sel.innerHTML = '';
  months.forEach(ym => {
    const opt = document.createElement('option');
    opt.value = ym;
    opt.textContent = monthLabel(ym);
    sel.appendChild(opt);
  });
  if (prev && months.includes(prev)) sel.value = prev;
}

function renderMonthlySummary() {
  const ym  = document.getElementById('monthSelect').value;
  const txs = transactions.filter(t => getYearMonth(t.date) === ym);
  const el  = document.getElementById('monthlySummaryContent');

  if (txs.length === 0) {
    el.innerHTML = `<div class="empty-month">Sin movimientos en ${monthLabel(ym)}</div>`;
    return;
  }

  const income  = txs.filter(t => t.type === 'income').reduce((s,t) => s + Number(t.amount), 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s,t) => s + Number(t.amount), 0);
  const incCats = groupBy(txs.filter(t => t.type === 'income'));
  const expCats = groupBy(txs.filter(t => t.type === 'expense'));

  el.innerHTML = `
    <div class="monthly-totals">
      <div class="monthly-stat income">
        <div class="stat-label">Ingresos</div>
        <div class="stat-value">${formatCurrency(income)}</div>
      </div>
      <div class="monthly-stat expense">
        <div class="stat-label">Gastos</div>
        <div class="stat-value">${formatCurrency(expense)}</div>
      </div>
    </div>
    ${Object.keys(incCats).length ? `<div style="margin-bottom:16px">
      <div class="cat-title">Ingresos por categoría</div>
      ${renderBars(incCats, income, 'income')}
    </div>` : ''}
    ${Object.keys(expCats).length ? `<div>
      <div class="cat-title">Gastos por categoría</div>
      ${renderBars(expCats, expense, 'expense')}
    </div>` : ''}
  `;
}

function groupBy(txs) {
  return txs.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {});
}

function renderBars(obj, total, type) {
  return Object.entries(obj)
    .sort((a,b) => b[1] - a[1])
    .map(([cat, amt]) => {
      const pct = total > 0 ? (amt / total * 100).toFixed(1) : 0;
      return `
        <div class="cat-bar-row">
          <div class="cat-bar-label">${escapeHtml(cat)}</div>
          <div class="cat-bar-track">
            <div class="cat-bar-fill ${type}" style="width:${pct}%"></div>
          </div>
          <div class="cat-bar-amount">${formatCurrency(amt)}</div>
        </div>`;
    }).join('');
}

/* =============================================
   LISTA DE MOVIMIENTOS
============================================= */
function renderList() {
  const filterType   = document.getElementById('filterType').value;
  const filterSearch = document.getElementById('filterSearch').value.toLowerCase();

  let list = [...transactions];
  if (filterType !== 'all') list = list.filter(t => t.type === filterType);
  if (filterSearch) list = list.filter(t =>
    t.category.toLowerCase().includes(filterSearch) ||
    (t.obs && t.obs.toLowerCase().includes(filterSearch))
  );

  const el = document.getElementById('txList');

  if (list.length === 0) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <div>${transactions.length === 0
          ? 'Aún no hay movimientos. ¡Cargá el primero!'
          : 'Sin resultados para ese filtro.'}</div>
      </div>`;
    return;
  }

  el.innerHTML = list.map(t => {
    const sign = t.type === 'income' ? '+' : '-';
    const dateF = new Date(t.date + 'T12:00:00').toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    return `
      <div class="tx-item">
        <div class="tx-stripe ${t.type}"></div>
        <div class="tx-info">
          <div class="tx-header">
            <span class="tx-category">${escapeHtml(t.category)}</span>
            <span class="tx-date">${dateF}</span>
          </div>
          ${t.obs ? `<div class="tx-obs">${escapeHtml(t.obs)}</div>` : ''}
        </div>
        <div class="tx-amount ${t.type}">${sign}${formatCurrency(t.amount)}</div>
        <button class="tx-delete" onclick="deleteTransaction('${t.id}')" title="Eliminar">🗑</button>
      </div>`;
  }).join('');
}

/* =============================================
   HELPERS
============================================= */
function formatCurrency(n) {
  return '$' + Math.abs(Number(n)).toLocaleString('es-AR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

function getYearMonth(dateStr) {
  const p = String(dateStr).split('-');
  return `${p[0]}-${p[1]}`;
}

function monthLabel(ym) {
  const [y, m] = ym.split('-');
  return new Date(parseInt(y), parseInt(m) - 1, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function setTodayDate() {
  const d  = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  document.getElementById('date').value = `${yy}-${mm}-${dd}`;
}

function setTopbarDate() {
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  document.getElementById('topbarDate').textContent =
    new Date().toLocaleDateString('es-AR', opts);
}

/* =============================================
   TOAST
============================================= */
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

/* =============================================
   EVENTOS GLOBALES
============================================= */
// Modal confirm button
document.getElementById('modalConfirmBtn').addEventListener('click', confirmModal);

// Cerrar modal con overlay o ESC
document.getElementById('modalOverlay').addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// Enter en campos del formulario
document.getElementById('amount')    ?.addEventListener('keydown', e => { if (e.key==='Enter') addTransaction(); });
document.getElementById('newCatName')?.addEventListener('keydown', e => { if (e.key==='Enter') addCategory(); });

// Fecha de hoy por defecto
setTodayDate();

/* =============================================
   ARRANQUE
============================================= */
init();
