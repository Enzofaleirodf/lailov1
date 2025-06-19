import React, { useState } from 'react';
import { ArrowUpRight, Heart } from 'lucide-react';
import { PlaceholderImage } from '../PlaceholderImage';

// ===== TYPES =====
interface BaseCardProps {
  // Layout
  viewMode: 'horizontal' | 'vertical';
  
  // Common data
  price: string;
  imageUrl: string;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
  onLink?: () => void;
  isNew?: boolean;
  date?: string;
  tags?: string[];
  discount?: string;
  badge?: string;
  
  // Content (varies by type)
  title: string;
  subtitle: string;
  metadata?: string; // For area, appraised value, etc.

  // ✅ NOVO: Partes do título para estilização separada (imóveis)
  titleParts?: {
    propertyType?: string;
    area?: string;
  };

  // ✅ NOVO: Partes do subtitle para estilização separada
  subtitleParts?: {
    address?: string;
    details?: string;
    city?: string; // ✅ NOVO: Cidade separada (pode truncar em veículos)
    state?: string; // ✅ NOVO: Estado separado (nunca trunca)
    cityState?: string;
  };

  // ✅ NOVO: Flags para controle de truncamento específico
  titleTruncate?: 'model' | 'propertyType';
  subtitleTruncate?: 'city' | 'address';
}

// ===== MAIN COMPONENT =====
export const AuctionCardBase: React.FC<BaseCardProps> = ({
  viewMode,
  price,
  imageUrl,
  isFavorited = false,
  onToggleFavorite,
  onLink,
  isNew,
  date,
  tags,
  discount,
  badge,
  title,
  subtitle,
  metadata,
  titleParts,
  subtitleParts,
  titleTruncate,
  subtitleTruncate
}) => {
  // ===== STATE =====
  const [imageError, setImageError] = useState(false);

  // ✅ NOVO: Determinar tipo baseado no título para placeholder
  const getImageType = (): 'property' | 'vehicle' => {
    // Se o título contém indicadores de veículo
    if (title.includes('•') && (title.includes('Carros') || title.includes('Motos') ||
        title.includes('Caminhões') || title.includes('Ônibus') || title.includes('Máquinas') ||
        title.includes('Apoio') || title.includes('Embarcações') || title.includes('Recreativos'))) {
      return 'vehicle';
    }
    // Se o título contém m² (área), é propriedade
    if (title.includes('m²')) {
      return 'property';
    }
    // Fallback: assumir propriedade
    return 'property';
  };

  // ===== SHARED ELEMENTS =====
  
  const ImageContainer = () => (
    <div className={`relative overflow-hidden rounded-xl flex-shrink-0 bg-gray-100 ${
      viewMode === 'horizontal' ? 'w-[94px] md:w-28 h-[60px] md:h-[72px]' : 'mb-4'
    }`}>
      <div className={`w-full ${
        viewMode === 'horizontal' ? 'h-[60px] md:h-[72px]' : 'aspect-[16/9]'
      }`}>
        {!imageError && imageUrl ? (
          <>
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={() => setImageError(true)}
            />
            {/* Gradiente sutil do topo e base para o meio */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.15) 100%)'
              }}
            />
          </>
        ) : (
          <PlaceholderImage
            type={getImageType()}
            className="w-full h-full"
          />
        )}
      </div>
      
      {/* Badge "Novo" */}
      <div className={`absolute ${
        viewMode === 'horizontal' 
          ? 'top-1.5 left-1.5 md:top-2 md:left-2' 
          : 'top-3 left-3'
      } bg-gradient-to-r from-yellow-400 to-orange-400 text-white ${
        viewMode === 'horizontal' ? 'text-[10px]' : 'text-xs'
      } font-bold uppercase ${
        viewMode === 'horizontal' 
          ? 'px-1.5 py-0.5 md:px-2 md:py-0.5' 
          : 'px-2.5 py-1'
      } rounded-md shadow-sm transition-opacity duration-200 ${
        isNew ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        Novo
      </div>
      
      {/* Favorite Button - Only for vertical */}
      {viewMode === 'vertical' && onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl transition-all duration-200 active:scale-95"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorited
                ? 'fill-blue-500 text-blue-500'
                : 'text-gray-600 hover:text-blue-500'
            }`}
          />
        </button>
      )}
    </div>
  );

  const ContentArea = () => (
    <div className={`flex-1 space-y-1 min-w-0 ${
      viewMode === 'horizontal' ? '' : 'min-h-[75px] flex flex-col'
    }`}>
      {badge && (
        <span className={`inline-block ${
          viewMode === 'horizontal' ? 'text-[10px]' : 'text-xs'
        } bg-blue-50 text-blue-700 ${
          viewMode === 'horizontal' 
            ? 'px-2 py-0.5 md:px-2.5 md:py-0.5' 
            : 'px-3 py-1'
        } rounded-full font-medium`}>
          {badge}
        </span>
      )}

      <div className={`flex items-start justify-between gap-2 ${
        viewMode === 'horizontal' ? '' : 'flex-1'
      }`}>
        <div className={`flex-1 min-w-0 ${
          viewMode === 'horizontal'
            ? 'h-[60px] flex flex-col justify-between'
            : ''
        }`}>
          {/* Title and Favorite (horizontal only) */}
          <div className={`flex items-start justify-between gap-2 ${
            viewMode === 'horizontal' ? 'flex-shrink-0' : ''
          }`}>
            <div className="flex-1 min-w-0">
              <h3 className={`${
                viewMode === 'horizontal'
                  ? 'text-[13px] md:text-sm'
                  : 'text-lg md:text-base'
              } font-bold text-gray-900 leading-tight ${
                // ✅ CORREÇÃO: Diminuir 3px entre título e endereço para imóveis mobile horizontal
                viewMode === 'horizontal' && titleParts ? 'mb-0 md:mb-1' : 'mb-1'
              } ${
                titleTruncate ? 'truncate' : ''
              }`}>
                {/* ✅ CORREÇÃO: Renderizar título com área estilizada para imóveis */}
                {titleParts ? (
                  <>
                    <span className={titleTruncate ? 'truncate' : ''}>{titleParts.propertyType}</span>
                    {titleParts.area && (
                      <>
                        <span className="text-gray-500 font-normal"> • </span>
                        <span className="text-gray-500 font-normal text-sm">{titleParts.area}</span>
                      </>
                    )}
                  </>
                ) : (
                  title
                )}
              </h3>
              
              <div className={`${
                viewMode === 'horizontal'
                  ? 'text-[11px] md:text-xs'
                  : 'text-sm md:text-xs'
              } text-gray-500 leading-tight ${
                viewMode === 'vertical' ? 'mb-2' : ''
              } ${viewMode === 'horizontal' ? 'flex items-center gap-1' : 'line-clamp-2'}`}>
                {/* ✅ CORREÇÃO: Renderizar baseado no tipo (imóveis vs veículos) */}
                {subtitleParts && viewMode === 'horizontal' ? (
                  <>
                    {/* Para imóveis: endereço + cidade/estado */}
                    {subtitleParts.address ? (
                      <>
                        <span className="truncate min-w-0">{subtitleParts.address}</span>
                        {subtitleParts.cityState && (
                          <>
                            <span className="flex-shrink-0"> – </span>
                            <span className="flex-shrink-0">{subtitleParts.cityState}</span>
                          </>
                        )}
                      </>
                    ) : (
                      /* Para veículos: detalhes (cor • ano) + cidade/estado */
                      <>
                        {subtitleParts.details && (
                          <span className="flex-shrink-0">{subtitleParts.details}</span>
                        )}
                        {subtitleParts.cityState && (
                          <>
                            <span className="flex-shrink-0"> – </span>
                            <span className="flex-shrink-0">{subtitleParts.cityState}</span>
                          </>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <span className={viewMode === 'horizontal' ? '' : 'line-clamp-2'}>{subtitle}</span>
                )}
              </div>
            </div>

            {/* Favorite Button - Only for horizontal */}
            {viewMode === 'horizontal' && onToggleFavorite && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite();
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-all duration-200 active:scale-95 flex-shrink-0"
              >
                <Heart
                  className={`w-4 h-4 transition-colors ${
                    isFavorited
                      ? 'fill-blue-500 text-blue-500'
                      : 'text-gray-400 hover:text-blue-500'
                  }`}
                />
              </button>
            )}
          </div>

          {/* Price and Metadata */}
          <div className={`flex items-baseline gap-1.5 flex-shrink-0 ${
            viewMode === 'horizontal' ? 'mt-0 md:mt-2' : 'mb-3 mt-auto'
          }`}>
            <span className={`${
              viewMode === 'horizontal' 
                ? 'text-[15px] md:text-lg' 
                : 'text-xl md:text-lg'
            } font-bold text-gray-900 leading-tight`}>
              {price}
            </span>
            
            {metadata && (
              <span className={`${
                viewMode === 'horizontal' 
                  ? 'text-[10px] md:text-xs' 
                  : 'text-sm md:text-xs'
              } text-gray-500`}>
                {metadata}
              </span>
            )}
            
            {discount && (
              <span className={`bg-gradient-to-r from-green-500 to-green-600 text-white ${
                viewMode === 'horizontal' 
                  ? 'text-[10px] md:text-xs px-1.5 py-0.5 md:px-2 md:py-0.5' 
                  : 'text-xs px-2.5 py-1'
              } font-bold uppercase rounded-md shadow-sm`}>
                {discount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const FooterArea = () => (
    <>
      <div className="h-px bg-gray-100 mb-3"></div>
      
      <div className={`flex items-center justify-between ${
        viewMode === 'vertical' ? 'pt-3' : ''
      }`}>
        <div className="flex flex-wrap gap-1.5">
          {tags && tags.slice(0, viewMode === 'vertical' ? 2 : undefined).map((tag, index) => (
            <span
              key={index}
              className={`${
                viewMode === 'horizontal'
                  ? 'text-[11px] md:text-xs px-2 py-1 md:px-2.5 md:py-1'
                  : 'text-xs px-2.5 py-1'
              } bg-gray-50 text-gray-700 rounded-md font-medium border border-gray-100`}
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {date && (
            <div className={`${
              viewMode === 'horizontal'
                ? 'text-[11px] md:text-xs'
                : 'text-xs'
            } text-gray-500 font-medium`}>
              {date}
            </div>
          )}
          {onLink && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLink();
              }}
              className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all duration-200 active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );

  // ===== RENDER =====
  return (
    <div className="group w-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 p-3 md:p-4 cursor-pointer">
      {viewMode === 'horizontal' ? (
        <>
          <div className="flex gap-3 md:gap-4 mb-3">
            <ImageContainer />
            <ContentArea />
          </div>
          <FooterArea />
        </>
      ) : (
        <>
          <ImageContainer />
          <ContentArea />
          <FooterArea />
        </>
      )}
    </div>
  );
};