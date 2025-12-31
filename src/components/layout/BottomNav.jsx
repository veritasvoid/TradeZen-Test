import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Tag, Settings } from 'lucide-react';

const navItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/month', icon: Calendar, label: 'Month' },
  { path: '/tags', icon: Tag, label: 'Tags' },
  { path: '/settings', icon: Settings, label: 'Settings' }
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40 md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path === '/month' && location.pathname.startsWith('/month/'));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex flex-col items-center justify-center flex-1 h-full
                transition-colors
                ${isActive 
                  ? 'text-accent' 
                  : 'text-text-secondary hover:text-text-primary'
                }
              `}
            >
              <Icon size={24} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
