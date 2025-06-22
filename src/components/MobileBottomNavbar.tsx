import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building, Car, Heart, Gavel, User } from 'lucide-react';
import { cn } from '../lib/utils';

export const MobileBottomNavbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Building, route: '/buscador/imoveis/todos', id: 'imoveis', label: 'Imóveis' },
    { icon: Car, route: '/buscador/veiculos/todos', id: 'veiculos', label: 'Veículos' },
    { icon: Heart, route: '/favoritos', id: 'favoritos', label: 'Favoritos' },
    { icon: Gavel, route: '/leiloeiros', id: 'leiloeiros', label: 'Leiloeiros' },
    { icon: User, route: '/usuario', id: 'usuario', label: 'Perfil' },
  ];

  const getActiveItem = () => {
    const path = location.pathname;
    if (path.startsWith('/buscador/imoveis')) return 'imoveis';
    if (path.startsWith('/buscador/veiculos')) return 'veiculos';
    if (path.startsWith('/favoritos')) return 'favoritos';
    if (path.startsWith('/leiloeiros')) return 'leiloeiros';
    if (path.startsWith('/usuario')) return 'usuario';
    return '';
  };

  const activeItem = getActiveItem();

  const handleNavigation = (route: string) => {
    console.log('Navigating to:', route); // Debug log
    navigate(route);
  };

  return (
    <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-100 px-2 py-2">
        <div className="flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.route)}
                className={cn(
                  "relative p-3 rounded-xl transition-all duration-200 active:scale-[0.95] focus:outline-none focus:ring-2 focus:ring-auction-500/20 focus:ring-offset-2",
                  isActive
                    ? 'bg-auction-600 text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};