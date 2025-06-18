import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { favorites } from '../lib/database';

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
    
    setLoading(true);
    try {
      const ids = await favorites.getFavoriteIds(user.id);
      setFavoriteIds(ids);
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (auctionId: string, auctionType: 'property' | 'vehicle') => {
    if (!user) return false;

    try {
      const isFav = favoriteIds.includes(auctionId);
      
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