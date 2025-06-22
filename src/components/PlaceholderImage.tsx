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
    <div className={`
      bg-gradient-to-br from-gray-50 via-gray-100 to-gray-150
      flex items-center justify-center
      ${className}
    `}>
      <div className="relative">
        <Icon
          className="w-8 h-8 text-gray-300"
          strokeWidth={1.5}
        />
        {/* 🚀 EFEITO SUTIL DE PROFUNDIDADE */}
        <div className="absolute inset-0 bg-white/20 rounded-full blur-sm scale-75"></div>
      </div>
    </div>
  );
};
