export default function Drawer({ user, open, activeSection, onNavigate, onClose, onLogout }) {
  const meta = user?.user_metadata || {};
  const name = meta.full_name || meta.name || 'Usuario';
  const email = user?.email || '';
  const avatar = meta.avatar_url || meta.picture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7B7FFF&color=fff`;

  const navItems = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard' },
    { key: 'transactions', icon: '📋', label: 'Movimientos' },
    { key: 'categories', icon: '🏷️', label: 'Categorías' },
  ];

  return (
    <>
      <div
        className={`drawer-overlay${open ? ' open' : ''}`}
        onClick={onClose}
      />
      <aside className={`drawer${open ? ' open' : ''}`}>
        <div className="drawer-header">
          <div className="drawer-logo">
            <div className="drawer-logo-icon">💰</div>
            <span>Fin<strong>Track</strong></span>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-user">
          <img className="user-avatar" src={avatar} alt="Avatar" />
          <div className="user-info">
            <div className="user-name">{name}</div>
            <div className="user-email">{email}</div>
          </div>
        </div>

        <nav className="drawer-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`nav-item${activeSection === item.key ? ' active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="drawer-footer">
          <button className="btn-logout" onClick={onLogout}>
            <span>↩</span> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
