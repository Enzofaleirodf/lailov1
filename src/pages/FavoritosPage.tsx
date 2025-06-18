import React, { useState, useEffect } from 'react';
import { Heart, Search, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';
import { favorites, auctions } from '../lib/database';
import { AuctionCard } from '../components/AuctionCard';
import { Auction } from '../types/auction';

export const FavoritosPage: React.FC = () => {
  const { user } = useAuth();
  const { favoriteIds, loading: favoritesLoading } = useFavorites();
  const [favoriteAuctions, setFavoriteAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar leilões favoritos
  useEffect(() => {
    if (user && favoriteIds.length > 0) {
      loadFavoriteAuctions();
    } else {
      setFavoriteAuctions([]);
    }
  }, [user, favoriteIds]);

  const loadFavoriteAuctions = async () => {
    if (!user || favoriteIds.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const favoritesList = await favorites.getUserFavorites(user.id);
      const auctionPromises = favoritesList.map(async (fav) => {
        try {
          const auction = await auctions.getAuctionById(fav.auction_id, fav.auction_type);
          if (auction) {
            // Converter para formato Auction
            return {
              _id: auction._id,
              type: fav.auction_type,
              image: auction.image || '',
              property_type: fav.auction_type === 'property' ? (auction as any).property_type : undefined,
              useful_area_m2: fav.auction_type === 'property' ? (auction as any).useful_area_m2 : undefined,
              property_address: fav.auction_type === 'property' ? (auction as any).property_address : undefined,
              vehicle_type: fav.auction_type === 'vehicle' ? (auction as any).vehicle_type : undefined,
              brand: fav.auction_type === 'vehicle' ? (auction as any).brand : undefined,
              model: fav.auction_type === 'vehicle' ? (auction as any).model : undefined,
              color: fav.auction_type === 'vehicle' ? (auction as any).color : undefined,
              year: fav.auction_type === 'vehicle' && (auction as any).year ? parseInt((auction as any).year) : undefined,
              city: auction.city || '',
              state: auction.state || '',
              initial_bid_value: auction.initial_bid_value || 0,
              appraised_value: auction.appraised_value || undefined,
              origin: auction.origin || '',
              stage: auction.stage || '',
              end_date: auction.end_date || '',
              href: auction.href || '',
              website: auction.website || '',
              website_image: auction.website_image || '',
              updated: auction.updated || '',
              data_scraped: auction.updated || '',
              docs: auction.docs || [],
              format: auction.format || ''
            } as Auction;
          }
          return null;
        } catch (error) {
          console.error(`Erro ao carregar leilão ${fav.auction_id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(auctionPromises);
      const validAuctions = results.filter((auction): auction is Auction => auction !== null);
      
      setFavoriteAuctions(validAuctions);
    } catch (err) {
      console.error('Erro ao carregar favoritos:', err);
      setError('Erro ao carregar seus favoritos');
    } finally {
      setLoading(false);
    }
  };

  // Se não estiver logado
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Seus Favoritos
            </h1>
            
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Faça login para ver seus leilões favoritos e manter-se atualizado com os leilões do seu interesse!
            </p>

            <a
              href="/auth/login"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Fazer Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (favoritesLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Carregando Favoritos...
            </h1>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Erro ao Carregar
            </h1>
            
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {error}
            </p>

            <button
              onClick={loadFavoriteAuctions}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0 md:pl-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Seus Favoritos
              </h1>
              <p className="text-gray-600">
                {favoriteAuctions.length > 0 
                  ? `${favoriteAuctions.length} leilão${favoriteAuctions.length > 1 ? 'ões' : ''} favorito${favoriteAuctions.length > 1 ? 's' : ''}`
                  : 'Nenhum leilão favorito'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {favoriteAuctions.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum favorito ainda
            </h3>
            
            <p className="text-gray-500 mb-6">
              Explore os leilões e marque seus favoritos clicando no ❤️
            </p>
            
            <a
              href="/buscador/veiculos/todos"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Explorar Leilões
            </a>
          </div>
        ) : (
          /* Auction Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {favoriteAuctions.map((auction) => (
              <AuctionCard
                key={auction._id}
                auction={auction}
                viewMode="vertical"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};