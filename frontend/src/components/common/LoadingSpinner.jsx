import React from 'react';

export const LoadingSpinner = ({ size = 'md', label = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-amber-200 border-t-emerald-700`}
        role="status"
      />
      {label && <span className="mt-2 text-xs text-stone-500 font-medium">{label}</span>}
    </div>
  );
};