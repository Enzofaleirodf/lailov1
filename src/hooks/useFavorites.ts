import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useFavorites = () => {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar favoritos do usuário
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavoriteIds([]);
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    // 🚀 UX CLEAN: Loading discreto apenas para operações lentas
    const loadingTimeout = setTimeout(() => setLoading(true), 300);

    try {
      // 🚀 DYNAMIC IMPORT para evitar conflito de code splitting
      const { favorites } = await import('../lib/database');
      const ids = await favorites.getFavoriteIds(user.id);
      setFavoriteIds(ids);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      clearTimeout(loadingTimeout);
      setLoading(false);
    }
  };

  const toggleFavorite = async (auctionId: string, auctionType: 'property' | 'vehicle') => {
    if (!user) return false;

    try {
      const isFav = favoriteIds.includes(auctionId);
      
      // 🚀 DYNAMIC IMPORT para evitar conflito de code splitting
      const { favorites } = await import('../lib/database');

      if (isFav) {
        await favorites.removeFavorite(user.id, auctionId);
        setFavoriteIds(prev => prev.filter(id => id !== auctionId));
      } else {
        await favorites.addFavorite(user.id, auctionId, auctionType);
        setFavoriteIds(prev => [...prev, auctionId]);
      }
      
      return !isFav;
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
      return favoriteIds.includes(auctionId);
    }
  };

  const isFavorite = (auctionId: string): boolean => {
    return favoriteIds.includes(auctionId);
  };

  return {
    favoriteIds,
    loading,
    toggleFavorite,
    isFavorite,
    refetch: loadFavorites
  };
};