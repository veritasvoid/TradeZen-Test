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
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl shadow-black/50">
      {/* Top gradient glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
      
      <div className="max-w-[1800px] mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          
          {/* Logo with 3D effect */}
          <button 
            onClick={() => navigate('/')}
            className="group flex items-center gap-3 transition-all duration-300 hover:scale-105"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              {/* Icon */}
              <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 p-2 rounded-xl shadow-lg shadow-blue-900/50">
                <TrendingUp size={20} className="text-white drop-shadow-lg" />
              </div>
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">
              TradeZen
            </span>
          </button>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            
            {/* Year Selector with 3D effect */}
            {selectedYear && onYearChange && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onYearChange(selectedYear - 1)}
                  className="px-3 py-1.5 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 rounded-lg transition-all text-sm font-semibold border border-slate-700/50 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  ← {selectedYear - 1}
                </button>
                
                <div className="relative px-4 py-1.5 rounded-lg overflow-hidden shadow-xl">
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 animate-gradient-x" />
                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                  <span className="relative text-lg font-black text-white drop-shadow-lg">{selectedYear}</span>
                </div>
                
                <button
                  onClick={() => onYearChange(selectedYear + 1)}
                  disabled={selectedYear >= maxYear}
                  className="px-3 py-1.5 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all text-sm font-semibold border border-slate-700/50 shadow-lg hover:shadow-xl hover:scale-105 disabled:hover:scale-100"
                >
                  {selectedYear + 1} →
                </button>
              </div>
            )}

            {/* Nav Buttons with 3D effect */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/month')}
                className={`px-4 py-1.5 rounded-lg transition-all text-sm font-semibold border shadow-lg hover:scale-105 ${
                  isActive('/month') 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-blue-500/50 shadow-blue-900/50 text-white' 
                    : 'bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border-slate-700/50'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => navigate('/tags')}
                className={`px-4 py-1.5 rounded-lg transition-all text-sm font-semibold border shadow-lg hover:scale-105 ${
                  isActive('/tags') 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-blue-500/50 shadow-blue-900/50 text-white' 
                    : 'bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border-slate-700/50'
                }`}
              >
                Tags
              </button>
              <button
                onClick={() => navigate('/settings')}
                className={`px-4 py-1.5 rounded-lg transition-all text-sm font-semibold border shadow-lg hover:scale-105 ${
                  isActive('/settings') 
                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 border-blue-500/50 shadow-blue-900/50 text-white' 
                    : 'bg-gradient-to-br from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 border-slate-700/50'
                }`}
              >
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="p-1.5 bg-gradient-to-br from-slate-800 to-slate-900 hover:from-red-900 hover:to-red-800 rounded-lg transition-all ml-2 border border-slate-700/50 shadow-lg hover:scale-105"
                title="Sign out"
              >
                <LogOut size={18} className="text-slate-400 hover:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient glow */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
    </div>
  );
};
