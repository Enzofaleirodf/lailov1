import * as React from "react"
import { cn } from "../../lib/utils"

interface FilterLoadingProps {
  type?: 'skeleton' | 'spinner' | 'pulse' | 'shimmer';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
  showMessage?: boolean;
}

// 🚀 SKELETON LOADING PARA FILTROS
export const FilterSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse", className)}>
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-10 bg-gray-200 rounded-xl"></div>
  </div>
);

// 🚀 SPINNER LOADING PARA AÇÕES
export const FilterSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn("animate-spin rounded-full border-2 border-gray-300 border-t-auction-600", sizeClasses[size], className)}>
    </div>
  );
};

// 🚀 PULSE LOADING PARA CONTADORES
export const FilterPulse: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("animate-pulse bg-gray-200 rounded", className)}>
    <div className="h-full w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"></div>
  </div>
);

// 🚀 SHIMMER LOADING PARA LISTAS
export const FilterShimmer: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className 
}) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>
    ))}
  </div>
);

// 🚀 COMPONENTE PRINCIPAL DE LOADING
export const FilterLoading: React.FC<FilterLoadingProps> = ({
  type = 'skeleton',
  size = 'md',
  className,
  message,
  showMessage = false
}) => {
  const renderLoading = () => {
    switch (type) {
      case 'spinner':
        return <FilterSpinner size={size} className={className} />;
      case 'pulse':
        return <FilterPulse className={className} />;
      case 'shimmer':
        return <FilterShimmer className={className} />;
      case 'skeleton':
      default:
        return <FilterSkeleton className={className} />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {renderLoading()}
      {showMessage && message && (
        <p className="text-xs text-gray-500 mt-2 text-center">{message}</p>
      )}
    </div>
  );
};

// 🚀 LOADING ESPECÍFICO PARA COMBOBOX
export const ComboBoxLoading: React.FC<{ message?: string }> = ({ 
  message = "Carregando..." 
}) => (
  <div className="flex items-center justify-center p-3">
    <FilterSpinner size="sm" className="mr-2" />
    <span className="text-xs text-gray-500">{message}</span>
  </div>
);

// 🚀 LOADING ESPECÍFICO PARA BOTÕES
export const ButtonLoading: React.FC<{ 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'sm', className }) => (
  <FilterSpinner size={size} className={cn("mr-2", className)} />
);

// 🚀 LOADING ESPECÍFICO PARA CONTADORES
export const CounterLoading: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("inline-flex items-center", className)}>
    <FilterPulse className="w-8 h-4 mr-1" />
    <span className="text-xs text-gray-400">...</span>
  </div>
);

// 🚀 LOADING ESPECÍFICO PARA RANGES
export const RangeLoading: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("space-y-2", className)}>
    <div className="flex justify-between">
      <FilterPulse className="w-16 h-3" />
      <FilterPulse className="w-16 h-3" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <FilterSkeleton />
      <FilterSkeleton />
    </div>
  </div>
);

// 🚀 LOADING OVERLAY PARA FILTROS
export const FilterLoadingOverlay: React.FC<{
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ isLoading, message = "Aplicando filtros...", children, className }) => (
  <div className={cn("relative", className)}>
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
        <div className="flex flex-col items-center">
          <FilterSpinner size="md" />
          <p className="text-xs text-gray-600 mt-2">{message}</p>
        </div>
      </div>
    )}
  </div>
);

// 🚀 LOADING PARA CARDS DE LEILÃO
export const AuctionCardLoading: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn("border border-gray-200 rounded-xl p-4 animate-pulse", className)}>
    <div className="space-y-3">
      {/* Imagem */}
      <div className="h-48 bg-gray-200 rounded-lg"></div>
      
      {/* Título */}
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      
      {/* Preço */}
      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
      
      {/* Badges */}
      <div className="flex gap-2">
        <div className="h-5 bg-gray-200 rounded w-16"></div>
        <div className="h-5 bg-gray-200 rounded w-20"></div>
      </div>
      
      {/* Localização */}
      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
    </div>
  </div>
);

// 🚀 LOADING PARA GRID DE LEILÕES
export const AuctionGridLoading: React.FC<{ 
  count?: number;
  className?: string;
}> = ({ count = 6, className }) => (
  <div className={cn("grid grid-cols-1 md:grid-cols-2 gap-4", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <AuctionCardLoading key={i} />
    ))}
  </div>
);

// 🚀 HOOK PARA LOADING STATES
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [message, setMessage] = React.useState<string>('');

  const startLoading = React.useCallback((msg?: string) => {
    setIsLoading(true);
    if (msg) setMessage(msg);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
    setMessage('');
  }, []);

  const updateMessage = React.useCallback((msg: string) => {
    setMessage(msg);
  }, []);

  return {
    isLoading,
    message,
    startLoading,
    stopLoading,
    updateMessage
  };
};
