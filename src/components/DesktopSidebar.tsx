import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building, Car, Heart, Gavel, User } from 'lucide-react';

export const DesktopSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const mainNavItems = [
    { icon: Building, route: '/buscador/imoveis/todos', id: 'imoveis', label: 'Imóveis' },
    { icon: Car, route: '/buscador/veiculos/todos', id: 'veiculos', label: 'Veículos' },
    { icon: Heart, route: '/favoritos', id: 'favoritos', label: 'Favoritos' },
    { icon: Gavel, route: '/leiloeiros', id: 'leiloeiros', label: 'Leiloeiros' },
  ];

  const profileItem = { icon: User, route: '/usuario', id: 'usuario', label: 'Perfil' };

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
    navigate(route);
  };

  const NavButton = ({ item, isActive }: { item: typeof mainNavItems[0], isActive: boolean }) => {
    const Icon = item.icon;

    return (
      <button
        onClick={() => handleNavigation(item.route)}
        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 group ${
          isActive
            ? 'bg-auction-600 text-white shadow-lg'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
        }`}
        title={item.label}
      >
        <Icon className="w-4 h-4" />
      </button>
    );
  };

  // Custom L Logo Component
  const LogoL = () => (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        {/* Gradient Definition */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0088D9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        
        {/* L Shape with rounded corners */}
        <path
          d="M6 4C6 2.89543 6.89543 2 8 2C9.10457 2 10 2.89543 10 4V18H20C21.1046 18 22 18.8954 22 20C22 21.1046 21.1046 22 20 22H8C6.89543 22 6 21.1046 6 20V4Z"
          fill="url(#logoGradient)"
        />
        
        {/* Subtle highlight for depth */}
        <path
          d="M6 4C6 2.89543 6.89543 2 8 2C9.10457 2 10 2.89543 10 4V18H20C21.1046 18 22 18.8954 22 20C22 21.1046 21.1046 22 20 22H8C6.89543 22 6 21.1046 6 20V4Z"
          fill="url(#logoGradient)"
          opacity="0.1"
        />
      </svg>
    </div>
  );

  return (
    <div className="hidden md:flex fixed left-0 top-0 h-full w-16 bg-white/95 backdrop-blur-md border-r border-gray-100 z-40">
      <div className="flex flex-col w-full items-center py-4">
        {/* Logo - Now just the L without button styling */}
        <div className="mb-6">
          <LogoL />
        </div>

        <nav className="flex-1 flex flex-col items-center">
          <div className="space-y-3">
            {mainNavItems.map((item) => (
              <NavButton
                key={item.id}
                item={item}
                isActive={activeItem === item.id}
              />
            ))}
          </div>
        </nav>

        <div>
          <NavButton
            item={profileItem}
            isActive={activeItem === profileItem.id}
          />
        </div>
      </div>
    </div>
  );
};