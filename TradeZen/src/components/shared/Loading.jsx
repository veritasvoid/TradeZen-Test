import React from 'react';

export const Loading = ({ type = 'spinner' }) => {
  if (type === 'spinner') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (type === 'skeleton-card') {
    return (
      <div className="card animate-pulse">
        <div className="h-6 bg-surface-hover rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-surface-hover rounded w-1/2"></div>
      </div>
    );
  }

  if (type === 'skeleton-grid') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-6 bg-surface-hover rounded mb-3"></div>
            <div className="h-20 bg-surface-hover rounded mb-3"></div>
            <div className="h-4 bg-surface-hover rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export const Skeleton = ({ className = '', width = 'full', height = '4' }) => {
  const widths = {
    full: 'w-full',
    '3/4': 'w-3/4',
    '1/2': 'w-1/2',
    '1/3': 'w-1/3',
    '1/4': 'w-1/4'
  };

  const heights = {
    '4': 'h-4',
    '6': 'h-6',
    '8': 'h-8',
    '12': 'h-12',
    '20': 'h-20'
  };

  return (
    <div 
      className={`${widths[width]} ${heights[height]} bg-surface-hover rounded animate-pulse ${className}`}
    />
  );
};
