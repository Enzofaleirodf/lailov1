import React from 'react';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled = false,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    xs: {
      container: 'w-7 h-3.5',
      thumb: 'w-2.5 h-2.5',
      translate: 'translate-x-3.5'
    },
    sm: {
      container: 'w-8 h-4',
      thumb: 'w-3 h-3',
      translate: 'translate-x-4'
    },
    md: {
      container: 'w-10 h-5',
      thumb: 'w-4 h-4',
      translate: 'translate-x-5'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={`
        relative inline-flex items-center rounded-full transition-colors duration-200 ease-in-out
        ${currentSize.container}
        ${checked 
          ? 'bg-blue-600 hover:bg-blue-700' 
          : 'bg-gray-200 hover:bg-gray-300'
        }
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        }
        ${className}
      `}
    >
      <span
        className={`
          inline-block rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out
          ${currentSize.thumb}
          ${checked ? currentSize.translate : 'translate-x-0.5'}
        `}
      />
    </button>
  );
};
