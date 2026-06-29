import { getTopbarDate } from '../lib/helpers';

const SECTION_TITLES = {
  dashboard: 'Dashboard',
  transactions: 'Movimientos',
  categories: 'Categorías',
};

export default function Topbar({ activeSection, onOpenDrawer }) {
  return (
    <header className="topbar">
      <button className="hamburger" onClick={onOpenDrawer} aria-label="Abrir menú">
        <span></span><span></span><span></span>
      </button>
      <div className="topbar-title">{SECTION_TITLES[activeSection] || activeSection}</div>
      <div className="topbar-date">{getTopbarDate()}</div>
    </header>
  );
}
