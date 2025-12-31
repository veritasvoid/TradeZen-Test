import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            {...toast} 
            onClose={() => hideToast(toast.id)} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const Toast = ({ message, type, onClose }) => {
  const icons = {
    success: <CheckCircle size={20} className="text-profit" />,
    error: <XCircle size={20} className="text-loss" />,
    warning: <AlertCircle size={20} className="text-amber-500" />,
    info: <AlertCircle size={20} className="text-accent" />
  };

  const bgColors = {
    success: 'bg-profit/10 border-profit/20',
    error: 'bg-loss/10 border-loss/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
    info: 'bg-accent/10 border-accent/20'
  };

  return (
    <div className={`
      ${bgColors[type]} 
      border rounded-lg p-4 shadow-lg 
      animate-slide-down
      flex items-center gap-3
      min-w-[300px]
    `}>
      {icons[type]}
      <p className="flex-1 text-sm text-text-primary">{message}</p>
      <button 
        onClick={onClose}
        className="text-text-secondary hover:text-text-primary transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};
