import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useCategories } from './hooks/useCategories';
import { useTransactions } from './hooks/useTransactions';
import { ToastProvider, useToast } from './components/Toast';
import AuthScreen from './components/AuthScreen';
import Drawer from './components/Drawer';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import Categories from './components/Categories';
import Modal from './components/Modal';

function AppInner() {
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth();
  const userId = user?.id;
  const { categories, loadCategories, ensureDefaults, addCategory, deleteCategory } = useCategories(userId);
  const { transactions, loadTransactions, addTransaction, deleteTransaction, clearAll, updateCategoryName } = useTransactions(userId);
  const showToast = useToast();

  const [activeSection, setActiveSection] = useState('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setDataLoading(true);
      await ensureDefaults();
      await Promise.all([loadCategories(), loadTransactions()]);
      setDataLoading(false);
    })();
  }, [userId, ensureDefaults, loadCategories, loadTransactions]);

  function navigateTo(section) {
    setActiveSection(section);
    setDrawerOpen(false);
  }

  async function handleLogin() {
    const err = await loginWithGoogle();
    if (err) showToast('❌ Error al iniciar sesión: ' + err);
  }

  function handleClearAllModal() {
    setModalConfig({
      action: 'clearAll',
      title: '¿Eliminar todo?',
      body: 'Se borrarán permanentemente todos tus movimientos. Esta acción no se puede deshacer.',
    });
  }

  function handleDeleteCategoryModal(catId, catName, catType, affected, alternatives) {
    if (affected > 0 && alternatives) {
      setModalConfig({
        action: 'recategorize',
        title: `¿Eliminar "${catName}"?`,
        body: `Tiene ${affected} movimiento(s) asignado(s). Elegí a qué categoría reasignarlos:`,
        alternatives,
        catId, catName, catType,
      });
    } else {
      setModalConfig({
        action: 'deleteCategory',
        title: `¿Eliminar "${catName}"?`,
        body: 'Esta categoría no tiene movimientos asociados y se eliminará definitivamente.',
        catId, catName, catType,
      });
    }
  }

  async function handleModalConfirm(recatValue) {
    const cfg = modalConfig;
    setModalConfig(null);
    if (!cfg) return;

    if (cfg.action === 'clearAll') {
      const result = await clearAll();
      if (result?.error) { showToast('❌ Error al eliminar'); console.error(result.error); }
      else showToast('🗑 Todos los registros eliminados');
    }

    if (cfg.action === 'deleteCategory') {
      const result = await deleteCategory(cfg.catId, cfg.catName, cfg.catType, null);
      if (result?.error) { showToast('❌ Error al eliminar categoría'); console.error(result.error); }
      else showToast(`🗑 Categoría "${cfg.catName}" eliminada`);
    }

    if (cfg.action === 'recategorize') {
      const result = await deleteCategory(cfg.catId, cfg.catName, cfg.catType, recatValue);
      if (result?.error) { showToast('❌ Error al reasignar movimientos'); console.error(result.error); }
      else {
        updateCategoryName(cfg.catName, recatValue, cfg.catType);
        showToast(`🗑 Categoría "${cfg.catName}" eliminada`);
      }
    }
  }

  if (authLoading) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
        <p>Cargando datos…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app-screen">
      <Drawer
        user={user}
        open={drawerOpen}
        activeSection={activeSection}
        onNavigate={navigateTo}
        onClose={() => setDrawerOpen(false)}
        onLogout={logout}
      />

      <div className="main-content">
        <Topbar activeSection={activeSection} onOpenDrawer={() => setDrawerOpen(true)} />

        {dataLoading && (
          <div className="loading-overlay">
            <div className="spinner" />
            <p>Cargando datos…</p>
          </div>
        )}

        {activeSection === 'dashboard' && (
          <section className="section active">
            <Dashboard
              transactions={transactions}
              categories={categories}
              onAddTransaction={addTransaction}
            />
          </section>
        )}

        {activeSection === 'transactions' && (
          <section className="section active">
            <TransactionList
              transactions={transactions}
              onDelete={deleteTransaction}
              onClearAll={handleClearAllModal}
            />
          </section>
        )}

        {activeSection === 'categories' && (
          <section className="section active">
            <Categories
              categories={categories}
              transactions={transactions}
              onAdd={addCategory}
              onDelete={handleDeleteCategoryModal}
            />
          </section>
        )}
      </div>

      <Modal
        config={modalConfig}
        onClose={() => setModalConfig(null)}
        onConfirm={handleModalConfirm}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
