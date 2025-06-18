import React from 'react';
import { Building2, Car } from 'lucide-react';

interface PlaceholderImageProps {
  type: 'property' | 'vehicle';
  className?: string;
}

export const PlaceholderImage: React.FC<PlaceholderImageProps> = ({ 
  type, 
  className = '' 
}) => {
  const Icon = type === 'property' ? Building2 : Car;
  
  return (
    <div className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}>
      <Icon 
        className="w-8 h-8 text-gray-400" 
        strokeWidth={1.5}
      />
    </div>
  );
};
