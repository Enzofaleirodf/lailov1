import React from 'react';
import { Heart, ArrowUpRight, MapPin, Calendar, Tag, TrendingUp } from 'lucide-react';
import { PlaceholderImage } from '../PlaceholderImage';

// 🎯 REVOLUTIONARY CARD DESIGN - MOBILE-FIRST COMPACTO
interface RevolutionaryCardProps {
  viewMode: 'horizontal' | 'vertical';
  
  // 📊 HIERARQUIA DE VALORES (Ordem de importância)
  bidValue: string;           // 1. Valor do Lance (PRINCIPAL)
  appraisedValue?: string;    // 2. Valor de Avaliação (CONTEXTO)
  
  // 🎨 VISUAL ELEMENTS
  imageUrl: string;
  title: string;
  subtitle: string;
  location: string;           // Cidade, Estado
  
  // 🏷️ BADGES (Ordem: Etapa → Origem → Data)
  stage?: string;             // 1. Etapa (mais importante)
  origin?: string;            // 2. Origem
  endDate?: string;           // 3. Data (menos importante)
  
  // ✨ FEEDBACK VISUAL
  discount?: number;          // % de desconto
  isNew?: boolean;           // Novo no site
  
  // 🎛️ INTERACTIONS
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  onLink?: () => void;
}

export const RevolutionaryCard: React.FC<RevolutionaryCardProps> = ({
  viewMode,
  bidValue,
  appraisedValue,
  imageUrl,
  title,
  subtitle,
  location,
  stage,
  origin,
  endDate,
  discount,
  isNew,
  isFavorited,
  onToggleFavorite,
  onLink
}) => {
  
  // 🎨 RESPONSIVE CLASSES
  const isHorizontal = viewMode === 'horizontal';
  
  if (isHorizontal) {
    // 📱 MOBILE HORIZONTAL - ULTRA COMPACTO
    return (
      <div className="group bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-3 cursor-pointer">
        <div className="flex gap-3">
          {/* 🖼️ IMAGEM PEQUENA (60x60) */}
          <div className="relative flex-shrink-0">
            <div className="w-[60px] h-[60px] rounded-lg overflow-hidden bg-gray-100">
              <PlaceholderImage 
                src={imageUrl} 
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* 🔥 BADGE DE DESCONTO - POSIÇÃO ABSOLUTA SOBRE IMAGEM */}
            {discount && discount > 0 && (
              <div className="absolute -top-1 -right-1 bg-success-500 text-white font-bold rounded-lg shadow-md inline-flex items-center justify-center" style={{ fontSize: '10px', padding: '4px 6px', lineHeight: '1' }}>
                -{discount}%
              </div>
            )}
          </div>
          
          {/* 📝 CONTEÚDO PRINCIPAL */}
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            {/* 🏷️ TÍTULO + BADGES TOP */}
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight">
                  {title}
                </h3>
                
                {/* ❤️ FAVORITO */}
                {onToggleFavorite && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite();
                    }}
                    className="p-1 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 transition-colors ${
                        isFavorited
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-400 hover:text-red-500'
                      }`}
                    />
                  </button>
                )}
              </div>
              
              {/* 📍 SUBTÍTULO + LOCALIZAÇÃO */}
              <div className="text-xs text-gray-600 leading-tight">
                <div className="truncate">{subtitle}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              </div>
            </div>
            
            {/* 💰 VALORES + BADGES */}
            <div className="flex items-end justify-between gap-2 mt-2">
              {/* 💰 HIERARQUIA DE VALORES */}
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-gray-900 leading-tight">
                  {bidValue}
                </div>
                {appraisedValue && (
                  <div className="text-[10px] text-gray-500 leading-tight">
                    Avaliado em {appraisedValue}
                  </div>
                )}
              </div>
              
              {/* 🏷️ BADGES COMPACTOS */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* ✨ NOVO */}
                {isNew && (
                  <span className="bg-error-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                    NOVO
                  </span>
                )}
                
                {/* 🎯 ETAPA (mais importante) */}
                {stage && (
                  <span className="text-auction-700 text-[8px] font-medium px-1.5 py-0.5 rounded" style={{ backgroundColor: '#f0faff' }}>
                    {stage}
                  </span>
                )}
                
                {/* 🔗 LINK EXTERNO */}
                {onLink && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLink();
                    }}
                    className="p-1 text-white bg-auction-600 hover:bg-auction-700 rounded-md transition-colors"
                  >
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // 💻 DESKTOP VERTICAL - MAIS ESPAÇOSO
  return (
    <div className="group bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer">
      {/* 🖼️ IMAGEM PRINCIPAL */}
      <div className="relative aspect-[4/3] bg-gray-100">
        <PlaceholderImage 
          src={imageUrl} 
          alt={title}
          className="w-full h-full object-cover"
        />
        
        {/* 🔥 BADGES SOBRE A IMAGEM - CANTO SUPERIOR */}
        <div className="absolute top-3 left-3 flex gap-2">
          {discount && discount > 0 && (
            <span className="bg-success-500 text-white font-bold rounded-lg shadow-md inline-flex items-center justify-center" style={{ fontSize: '10px', padding: '4px 6px', lineHeight: '1' }}>
              -{discount}%
            </span>
          )}
          
          {isNew && (
            <span className="bg-gradient-to-r from-error-500 to-error-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg">
              NOVO
            </span>
          )}
        </div>
        
        {/* ❤️ FAVORITO - CANTO SUPERIOR DIREITO */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-lg transition-all shadow-sm"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorited
                  ? 'fill-red-500 text-red-500'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            />
          </button>
        )}
      </div>
      
      {/* 📝 CONTEÚDO */}
      <div className="p-4 space-y-3">
        {/* 🏷️ TÍTULO */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600 leading-tight">
            {subtitle}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-sm text-gray-500">{location}</span>
          </div>
        </div>
        
        {/* 💰 VALORES */}
        <div className="space-y-1">
          <div className="text-2xl font-bold text-gray-900">
            {bidValue}
          </div>
          {appraisedValue && (
            <div className="text-sm text-gray-500">
              Avaliado em {appraisedValue}
            </div>
          )}
        </div>
        
        {/* 🏷️ BADGES + AÇÕES */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex gap-2">
            {stage && (
              <span className="text-auction-700 text-xs font-medium px-2.5 py-1 rounded-md" style={{ backgroundColor: '#f0faff' }}>
                {stage}
              </span>
            )}
            {origin && (
              <span className="text-auction-700 text-xs font-medium px-2.5 py-1 rounded-md" style={{ backgroundColor: '#f0faff' }}>
                {origin}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {endDate && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                {endDate}
              </div>
            )}
            
            {onLink && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLink();
                }}
                className="p-2 text-white bg-auction-600 hover:bg-auction-700 rounded-lg transition-colors"
              >
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
