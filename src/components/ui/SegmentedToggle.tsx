import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface SegmentedToggleOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface SegmentedToggleProps {
  options?: SegmentedToggleOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline';
  className?: string;
  disabled?: boolean;
}

const SegmentedToggle: React.FC<SegmentedToggleProps> = ({
  options = [
    { id: 'entire-place', label: 'Entire place' },
    { id: 'private-room', label: 'Private room' },
    { id: 'shared-room', label: 'Shared room' }
  ],
  defaultValue = options[0]?.id || '',
  value,
  onChange,
  size = 'md',
  variant = 'default',
  className,
  disabled = false
}) => {
  const [selectedValue, setSelectedValue] = useState(value || defaultValue);
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const sizeClasses = {
    sm: 'h-10 text-xs',
    md: 'h-12 text-sm',
    lg: 'h-14 text-base'
  };

  const containerSizeClasses = {
    sm: 'p-1',
    md: 'p-1',
    lg: 'p-1.5'
  };

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    updateIndicator();
  }, [selectedValue, options]);

  const updateIndicator = () => {
    const selectedIndex = options.findIndex(option => option.id === selectedValue);
    const selectedButton = buttonRefs.current[selectedIndex];
    
    if (selectedButton && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const buttonRect = selectedButton.getBoundingClientRect();
      
      setIndicatorStyle({
        width: buttonRect.width,
        height: buttonRect.height,
        transform: `translateX(${buttonRect.left - containerRect.left - (size === 'lg' ? 6 : 4)}px)`,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      });
    }
  };

  const handleSelect = (optionId: string) => {
    if (disabled) return;
    
    const option = options.find(opt => opt.id === optionId);
    if (option?.disabled) return;

    setSelectedValue(optionId);
    onChange?.(optionId);
  };

  const handleKeyDown = (event: React.KeyboardEvent, optionId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect(optionId);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const currentIndex = options.findIndex(option => option.id === optionId);
      const direction = event.key === 'ArrowLeft' ? -1 : 1;
      let nextIndex = currentIndex + direction;
      
      if (nextIndex < 0) nextIndex = options.length - 1;
      if (nextIndex >= options.length) nextIndex = 0;
      
      const nextOption = options[nextIndex];
      if (nextOption && !nextOption.disabled) {
        buttonRefs.current[nextIndex]?.focus();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex items-center rounded-xl border border-gray-200 bg-transparent w-full',
        containerSizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      role="radiogroup"
      aria-label="Format selector"
    >
      {/* Active indicator */}
      <div
        className={cn(
          'absolute rounded-xl bg-blue-600 shadow-lg border border-blue-700/20',
          size === 'lg' ? 'top-1.5 left-1.5' : 'top-1 left-1'
        )}
        style={indicatorStyle}
        aria-hidden="true"
      />
      
      {options.map((option, index) => (
        <button
          key={option.id}
          ref={el => buttonRefs.current[index] = el}
          type="button"
          role="radio"
          aria-checked={selectedValue === option.id}
          aria-disabled={option.disabled || disabled}
          tabIndex={selectedValue === option.id ? 0 : -1}
          className={cn(
            'relative z-10 flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white flex-1 px-4',
            sizeClasses[size],
            selectedValue === option.id
              ? 'text-white font-semibold'
              : 'text-gray-600 hover:text-gray-900',
            (option.disabled || disabled) && 'cursor-not-allowed opacity-50',
            !selectedValue === option.id && !option.disabled && !disabled && 'hover:bg-gray-100/80'
          )}
          onClick={() => handleSelect(option.id)}
          onKeyDown={(e) => handleKeyDown(e, option.id)}
          disabled={option.disabled || disabled}
        >
          {option.icon && (
            <span className="flex-shrink-0" aria-hidden="true">
              {option.icon}
            </span>
          )}
          <span className="whitespace-nowrap">{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export { SegmentedToggle };
export type { SegmentedToggleOption, SegmentedToggleProps };
