import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export const Header = ({ 
  title = 'TradeZen', 
  showBack = false, 
  actions = null 
}) => {
  const navigate = useNavigate();
  const signOut = useAuthStore(state => state.signOut);

  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out?')) {
      signOut();
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 bg-background border-b border-border z-30">
      <div className="flex items-center justify-between h-16 px-4 max-w-7xl mx-auto">
        {/* Left side */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-surface rounded-lg transition-colors"
            >
              <ArrowLeft size={20} className="text-text-secondary" />
            </button>
          )}
          <h1 className="text-xl font-bold text-text-primary">
            {title}
          </h1>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {actions}
          <button
            onClick={handleSignOut}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut size={20} className="text-text-secondary" />
          </button>
        </div>
      </div>
    </header>
  );
};
