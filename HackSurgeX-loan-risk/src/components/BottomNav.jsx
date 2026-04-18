import { Home, LineChart, Clock, Settings } from 'lucide-react';
import { t } from '../translations';
import './BottomNav.css';

function BottomNav({ activeScreen, onNavigate, language = 'en' }) {
  const navItems = [
    { id: 'home', icon: Home, label: t('nav_home', language) },
    { id: 'market', icon: LineChart, label: t('nav_market', language) },
    { id: 'history', icon: Clock, label: t('nav_history', language) },
    { id: 'settings', icon: Settings, label: t('nav_settings', language) }
  ];

  return (
    <div className="bottom-nav-container animate-fade-in">
      <nav className="bottom-nav glass-panel">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <div className="nav-icon-wrapper">
                <Icon 
                  size={isActive ? 24 : 22} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className="nav-icon"
                />
                {isActive && <div className="nav-indicator" />}
              </div>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default BottomNav;
