import React from 'react';
import { Plus } from 'lucide-react';

export const FAB = ({ onClick, icon: Icon = Plus, label = 'Add' }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-30 w-14 h-14 bg-accent hover:bg-accent-hover text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center active:scale-95"
      aria-label={label}
    >
      <Icon size={24} />
    </button>
  );
};
