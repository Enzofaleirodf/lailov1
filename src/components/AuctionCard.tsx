import React, { useState, useMemo, useCallback, memo } from 'react';
import { Auction, ViewMode } from '../types/auction';
import { AuctionCardBase } from './cards/AuctionCardBase';
import { DateUtils } from '../utils/dateUtils';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';
import { useProximityPrefetch, useImagePrefetch } from '../hooks/useSmartPrefetch';

interface AuctionCardProps {
  auction: Auction;
  viewMode: ViewMode;
  priority?: boolean; // 🚀 PRIORIDADE para imagens críticas
}

// 🚀 OTIMIZAÇÃO: React.memo com comparação customizada para máxima performance
export const AuctionCard: React.FC<AuctionCardProps> = React.memo(({ auction, viewMode, priority = false }) => {
  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();

  // 🚀 SMART PREFETCH: Prefetch inteligente baseado em hover
  const { attachListeners } = useProximityPrefetch(
    auction.href || '#',
    !!auction.href // Só ativar se tiver link
  );

  // 🚀 IMAGE PREFETCH: Prefetch de imagens relacionadas
  useImagePrefetch(
    auction.image ? [auction.image] : [],
    !priority // Só fazer prefetch se não for prioridade (já carregada)
  );
  
  // 🛡️ CORREÇÃO: Verificação defensiva para evitar erro #130
  if (!auction || typeof auction !== 'object') {
    return null;
  }

  // Verificar propriedades essenciais
  if (!auction._id || !auction.type) {
    return null;
  }

  // Estado do favorito baseado no hook
  const isFavorited = user ? isFavorite(auction._id) : false;

  // 🚀 OTIMIZAÇÃO: Memoizar formatação de moeda
  const formatCurrency = useCallback((amount: number) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return 'R$ 0';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  // ✅ CORREÇÃO: Formatar data/horário no formato brasileiro compacto
  const formatEndDateTime = useCallback((endDate: string) => {
    const date = DateUtils.parse(endDate);
    if (!date) return 'Data inválida';

    // Formato: 22/07/25 às 10:00 (ano com 2 dígitos para economizar espaço)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit', // ✅ CORREÇÃO: Ano com 2 dígitos (25 em vez de 2025)
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    }).format(date).replace(',', ' às');
  }, []);

  // 🚀 OTIMIZAÇÃO: Memoizar cálculo de desconto
  const discount = useMemo(() => {
    // ✅ CORREÇÃO ROBUSTA: Tratar todos os casos possíveis de valores inválidos
    const rawAppraised = auction.appraised_value;
    const rawInitial = auction.initial_bid_value;

    // Verificar se os valores existem e não são null/undefined
    if (rawAppraised == null || rawInitial == null) {
      return null;
    }

    // Converter para números de forma segura
    const appraisedValue = typeof rawAppraised === 'string' ? parseFloat(rawAppraised) : Number(rawAppraised);
    const initialBidValue = typeof rawInitial === 'string' ? parseFloat(rawInitial) : Number(rawInitial);

    // ✅ CORREÇÃO: Verificações rigorosas
    if (
      isNaN(appraisedValue) ||           // Não é um número válido
      isNaN(initialBidValue) ||          // Não é um número válido
      appraisedValue <= 0 ||             // Valor avaliado deve ser positivo
      initialBidValue <= 0 ||            // Lance inicial deve ser positivo
      appraisedValue <= initialBidValue  // Valor avaliado deve ser maior que lance
    ) {
      return null;
    }

    // ✅ CORREÇÃO CRÍTICA: Filtrar dados suspeitos do banco
    // Casos comuns de dados inconsistentes:
    // 1. Lance inicial muito baixo (< R$ 100) com avaliação alta
    // 2. Desconto maior que 95% (geralmente indica erro nos dados)
    // 3. Diferença muito desproporcional entre valores

    const discountValue = ((appraisedValue - initialBidValue) / appraisedValue) * 100;

    // Filtrar casos suspeitos:
    if (
      initialBidValue < 100 ||           // Lance inicial muito baixo (suspeito)
      discountValue > 95 ||              // Desconto muito alto (suspeito)
      appraisedValue / initialBidValue > 1000  // Proporção muito alta (suspeito)
    ) {
      return null;
    }

    // Retornar apenas se desconto for positivo e razoável
    return discountValue > 0 ? Math.round(discountValue) : null;
  }, [auction.appraised_value, auction.initial_bid_value]);

  // 🚀 OTIMIZAÇÃO: Memoizar verificação de "novo" usando DateUtils
  const isNew = useMemo(() => {
    return DateUtils.isWithinLast24Hours(auction.data_scraped);
  }, [auction.data_scraped]);

  // 🚀 OTIMIZAÇÃO: Memoizar handlers
  const handleToggleFavorite = useCallback(async () => {
    if (!user) {
      // Redirecionar para login se não estiver logado
      window.location.href = '/auth/login';
      return;
    }
    
    const auctionType = auction.type === 'vehicle' ? 'vehicle' : 'property';
    await toggleFavorite(auction._id, auctionType);
  }, [user, auction._id, auction.type, toggleFavorite]);

  const handleLink = useCallback(() => {
    if (auction.href) {
      window.open(auction.href, '_blank');
    }
  }, [auction.href]);

  // 🚀 OTIMIZAÇÃO: Memoizar dados derivados baseados no tipo
  const cardData = useMemo(() => {
    const isVehicle = auction.type === 'vehicle';
    
    // Create tags array with only origem and etapa
    const tags = [];
    if (auction.origin) tags.push(auction.origin);
    if (auction.stage) tags.push(auction.stage);

    // Calculate discount text
    const discountText = discount ? `${discount}% OFF` : undefined;

    if (isVehicle) {
      // ✅ CORREÇÃO: Vehicle card data com truncamento específico
      // Linha 1: model deve truncar se invadir espaço do botão favorito
      const brand = auction.brand || "Não informado";
      const model = auction.model || "Não informado";

      // ✅ CORREÇÃO: Separar informações para estilização diferente
      const color = auction.color || "Não informado";
      const year = auction.year?.toString() || "N/A";
      const city = auction.city || 'N/A';
      const state = auction.state || 'N/A';

      const subtitleParts = {
        details: `${color} • ${year}`,
        city: city, // ✅ NOVO: Cidade separada para truncamento
        state: state, // ✅ NOVO: Estado separado (nunca trunca)
        cityState: `${city}, ${state}` // ✅ MANTER: Para compatibilidade
      };

      return {
        title: `${brand} ${model}`, // model pode truncar
        subtitle: `${color} • ${year} • ${city}, ${state}`, // Fallback para compatibilidade
        subtitleParts, // ✅ NOVO: Partes separadas para estilização
        metadata: auction.appraised_value ? `Avaliado em ${formatCurrency(auction.appraised_value)}` : undefined, // 🎯 HIERARQUIA: Mostrar valor de avaliação
        tags,
        discountText,
        // ✅ NOVO: Flags para controle de truncamento
        titleTruncate: 'model', // Indica que model deve truncar
        subtitleTruncate: 'city' // Indica que city deve truncar
      };
    } else {
      // ✅ CORREÇÃO: Property card data com truncamento específico
      const propertyType = auction.property_type || "Imóvel"; // ✅ USAR property_type
      const area = auction.useful_area_m2 ? `${auction.useful_area_m2}m²` : undefined;
      const address = auction.property_address || 'Endereço não informado';
      const city = auction.city || 'N/A';
      const state = auction.state || 'N/A';

      // ✅ CORREÇÃO: Criar título com área estilizada separadamente
      const titleParts = {
        propertyType,
        area
      };

      // ✅ CORREÇÃO: Separar endereço de cidade/estado para estilização diferente
      const subtitleParts = {
        address,
        cityState: `${city}, ${state}`
      };

      return {
        title: propertyType, // ✅ CORREÇÃO: Apenas o tipo de imóvel
        titleParts, // ✅ NOVO: Partes separadas para estilização
        subtitle: `${address} – ${city}, ${state}`, // Fallback para compatibilidade
        subtitleParts, // ✅ NOVO: Partes separadas para estilização
        metadata: auction.appraised_value ? `Avaliado em ${formatCurrency(auction.appraised_value)}` : undefined, // 🎯 HIERARQUIA: Mostrar valor de avaliação
        tags,
        discountText,
        // ✅ NOVO: Flags para controle de truncamento
        titleTruncate: 'propertyType', // Indica que tipo de imóvel deve truncar
        subtitleTruncate: 'address' // Indica que endereço deve truncar
      };
    }
  }, [
    auction.type,
    auction.brand,
    auction.model,
    auction.color,
    auction.year,
    auction.city,
    auction.state,
    auction.property_type, // ✅ CORREÇÃO: Usar property_type
    auction.property_address,
    auction.useful_area_m2,
    auction.appraised_value, // 🎯 HIERARQUIA: Adicionado de volta para mostrar valor de avaliação
    auction.origin,
    auction.stage,
    discount,
    formatCurrency
  ]);

  // 🚨 DEBUG: Verificar dados da imagem
  const imageUrl = auction.image || '';
  const hasValidImage = imageUrl && imageUrl.trim() !== '' && imageUrl !== 'undefined' && imageUrl !== 'null';

  console.log('🖼️ AuctionCard Image Debug:', {
    id: auction._id,
    originalImage: auction.image,
    imageUrl,
    hasValidImage,
    imageType: typeof auction.image
  });

  // 🚀 REF CALLBACK: Anexar listeners de prefetch
  const cardRef = useCallback((element: HTMLElement | null) => {
    if (element && auction.href) {
      const cleanup = attachListeners(element);
      return cleanup;
    }
  }, [attachListeners, auction.href]);

  return (
    <div ref={cardRef}>
      <AuctionCardBase
        viewMode={viewMode}
        price={formatCurrency(auction.initial_bid_value || 0)}
        imageUrl={hasValidImage ? imageUrl : ''}
        isFavorited={isFavorited}
        onToggleFavorite={handleToggleFavorite}
        onLink={handleLink}
        isNew={isNew}
        date={formatEndDateTime(auction.end_date)}
        tags={cardData.tags}
        discount={cardData.discountText}
        title={cardData.title}
        subtitle={cardData.subtitle}
        metadata={cardData.metadata}
        titleParts={cardData.titleParts}
        subtitleParts={cardData.subtitleParts}
        titleTruncate={cardData.titleTruncate}
        subtitleTruncate={cardData.subtitleTruncate}
        priority={priority} // 🚀 PRIORIDADE para imagens críticas
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // 🚀 OTIMIZAÇÃO: Comparação customizada para React.memo
  // Comparar apenas propriedades que afetam a renderização
  return (
    prevProps.auction._id === nextProps.auction._id &&
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.priority === nextProps.priority &&
    prevProps.auction.initial_bid_value === nextProps.auction.initial_bid_value &&
    prevProps.auction.appraised_value === nextProps.auction.appraised_value &&
    prevProps.auction.image === nextProps.auction.image
  );
});

// 🚀 OTIMIZAÇÃO: Definir displayName para debugging
AuctionCard.displayName = 'AuctionCard';