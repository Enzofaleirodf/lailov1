import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Car, 
  Bike, 
  Truck, 
  Bus, 
  Ship, 
  Wrench, 
  Home, 
  Building, 
  TreePine, 
  Store, 
  Warehouse, 
  Mountain, 
  Building2, 
  HelpCircle,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Category } from '../types/auction';
import { MAPPINGS } from '../config/mappings';

interface TypeNavigationTabsProps {
  category: Category;
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: string;
}

export const TypeNavigationTabs: React.FC<TypeNavigationTabsProps> = React.memo(({ category }) => {
  const navigate = useNavigate();
  const { tipo } = useParams<{ tipo: string }>();
  
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const mobileTabsRef = useRef<HTMLDivElement>(null);

  const [showLeftGradient, setShowLeftGradient] = useState(false);
  const [showRightGradient, setShowRightGradient] = useState(false);

  const getCurrentType = useCallback((): string => {
    if (!tipo) return 'todos';
    
    if (category === 'veiculos') {
      // Mapear slugs antigos para novos se necessário
      if (tipo === 'reboques') return 'apoio';
      if (tipo === 'sucata') return 'nao-informado';
      return MAPPINGS.isValidVehicleType(tipo) ? tipo : 'todos';
    } else {
      // Mapear slug antigo para novo se necessário
      if (tipo === 'terrenos') return 'terrenos-e-lotes';
      return MAPPINGS.isValidPropertyType(tipo) ? tipo : 'todos';
    }
  }, [tipo, category]);

  const currentType = getCurrentType();

  // Redirecionar se o tipo for inválido ou se for um slug antigo
  useEffect(() => {
    if (tipo && tipo !== currentType) {
      navigate(`/buscador/${category}/${currentType}`, { replace: true });
    }
  }, [tipo, currentType, category, navigate]);

  const vehicleIcons = useMemo(() => ({
    'todos': MoreHorizontal,
    'carros': Car,
    'motos': Bike,
    'caminhoes': Truck,
    'onibus': Bus,
    'maquinas': Wrench,
    'apoio': Truck,
    'embarcacoes': Ship,
    'recreativos': Car,
    'nao-informado': HelpCircle,
  }), []);

  const propertyIcons = useMemo(() => ({
    'todos': MoreHorizontal,
    'apartamentos': Building,
    'casas': Home,
    'comerciais': Store,
    'compactos': Building2,
    'condominios': Building,
    'galpoes': Warehouse,
    'garagem': Car,
    'hospedagem': Building,
    'industriais': Warehouse,
    'mistos': Building2,
    'predios': Building,
    'rurais': TreePine,
    'terrenos-e-lotes': Mountain,
    'nao-informado': HelpCircle,
  }), []);

  const tabs = useMemo((): TabItem[] => {
    if (category === 'veiculos') {
      return MAPPINGS.VEHICLE_TYPES.map(type => ({
        id: type,
        label: MAPPINGS.getVehicleTypeLabel(type),
        icon: vehicleIcons[type],
        route: `/buscador/veiculos/${type}`
      }));
    } else {
      return MAPPINGS.PROPERTY_TYPES.map(type => ({
        id: type,
        label: MAPPINGS.getPropertyTypeLabel(type),
        icon: propertyIcons[type],
        route: `/buscador/imoveis/${type}`
      }));
    }
  }, [category, vehicleIcons, propertyIcons]);

  const updateMobileGradients = useCallback(() => {
    const container = mobileTabsRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    
    setShowLeftGradient(scrollLeft > 10);
    setShowRightGradient(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const container = mobileTabsRef.current;
    if (!container) return;

    updateMobileGradients();
    container.addEventListener('scroll', updateMobileGradients, { passive: true });
    
    const timeoutId = setTimeout(updateMobileGradients, 100);

    return () => {
      container.removeEventListener('scroll', updateMobileGradients);
      clearTimeout(timeoutId);
    };
  }, [updateMobileGradients, tabs]);

  useEffect(() => {
    const handleResize = () => {
      updateMobileGradients();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [updateMobileGradients]);

  const handleScrollLeft = useCallback(() => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  }, []);

  const handleScrollRight = useCallback(() => {
    if (tabsContainerRef.current) {
      tabsContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  }, []);

  const handleTabClick = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);

  const TabButton = React.memo<{ tab: TabItem; isActive: boolean }>(({ tab, isActive }) => {
    const handleClick = useCallback(() => {
      handleTabClick(tab.route);
    }, [tab.route]);

    return (
      <button
        onClick={handleClick}
        className={`
          px-3 py-2 text-sm font-semibold transition-all duration-200
          whitespace-nowrap flex-shrink-0 rounded-xl active:scale-95 flex items-center justify-center
          ${isActive
            ? 'bg-auction-600 text-white shadow-lg'
            : 'text-gray-600 hover:text-auction-600 hover:bg-gray-100 border border-transparent hover:border-gray-200'
          }
        `}
      >
        {tab.label}
      </button>
    );
  });

  TabButton.displayName = 'TabButton';

  return (
    <div className="w-full">
      {/* Desktop version */}
      <div className="hidden min-[768px]:block">
        <div className="relative w-full">
          <div
            ref={tabsContainerRef}
            className="absolute inset-0 flex flex-nowrap overflow-x-auto scrollbar-hide gap-2 py-3 pr-20"
          >
            {tabs.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={currentType === tab.id}
              />
            ))}
          </div>
          
          {/* Gradiente suave para transição visual */}
          <div className="absolute top-0 right-20 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none z-10"></div>

          <div className="absolute top-0 right-0 bottom-0 w-20 flex items-center justify-end gap-1 bg-white z-20 pr-1">
            <button
              onClick={handleScrollLeft}
              className="w-8 h-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow active:scale-95"
              title="Rolar para a esquerda"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleScrollRight}
              className="w-8 h-8 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow active:scale-95"
              title="Rolar para a direita"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          <div className="h-14 w-full"></div>
        </div>
      </div>

      {/* Mobile version */}
      <div className="max-[767px]:block min-[768px]:hidden">
        <div className="relative">
          <div 
            ref={mobileTabsRef}
            className="flex overflow-x-auto scrollbar-hide gap-2 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {tabs.map((tab) => (
              <div key={tab.id} className="flex-shrink-0">
                <TabButton
                  tab={tab}
                  isActive={currentType === tab.id}
                />
              </div>
            ))}
          </div>

          <div
            className={`absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-white/90 via-white/60 to-transparent pointer-events-none transition-opacity duration-300 ${
              showLeftGradient ? 'opacity-100' : 'opacity-0'
            }`}
          />

          <div
            className={`absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white/90 via-white/60 to-transparent pointer-events-none transition-opacity duration-300 ${
              showRightGradient ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
});

TypeNavigationTabs.displayName = 'TypeNavigationTabs';