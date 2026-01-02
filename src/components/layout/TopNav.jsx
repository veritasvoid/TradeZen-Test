import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TrendingUp, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

export const TopNav = ({ selectedYear, onYearChange, maxYear }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const signOut = useAuthStore(state => state.signOut);

  const handleSignOut = () => {
    if (confirm('Are you sure you want to sign out?')) {
      signOut();
      navigate('/');
    }
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-sm">
      <div className="max-w-[1800px] mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          
          {/* Logo - Clickable to Dashboard */}
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl">
              <TrendingUp size={20} className="text-white" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              TradeZen
            </span>
          </button>

          {/* Right Side: Year Selector + Nav + Logout */}
          <div className="flex items-center gap-4">
            
            {/* Year Selector - Only show on Dashboard */}
            {selectedYear && onYearChange && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onYearChange(selectedYear - 1)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all text-sm font-semibold"
                >
                  ← {selectedYear - 1}
                </button>
                
                <div className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <span className="text-lg font-black">{selectedYear}</span>
                </div>
                
                <button
                  onClick={() => onYearChange(selectedYear + 1)}
                  disabled={selectedYear >= maxYear}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all text-sm font-semibold"
                >
                  {selectedYear + 1} →
                </button>
              </div>
            )}

            {/* Nav Buttons - NO DASHBOARD (Logo does that) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/month')}
                className={`px-4 py-1.5 rounded-lg transition-all text-sm font-semibold ${
                  isActive('/month') 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => navigate('/tags')}
                className={`px-4 py-1.5 rounded-lg transition-all text-sm font-semibold ${
                  isActive('/tags') 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                Tags
              </button>
              <button
                onClick={() => navigate('/settings')}
                className={`px-4 py-1.5 rounded-lg transition-all text-sm font-semibold ${
                  isActive('/settings') 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                    : 'bg-slate-800 hover:bg-slate-700'
                }`}
              >
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors ml-2"
                title="Sign out"
              >
                <LogOut size={18} className="text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
