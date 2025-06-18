import { useState, useEffect, useMemo } from 'react';
import { Auction, PaginationData, UsePaginationParams } from '../types/auction';

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  currentAuctions: Auction[];
  handlePageChange: (page: number) => void;
}

export const usePagination = ({ 
  auctions, 
  itemsPerPage, 
  dependencies 
}: UsePaginationParams): UsePaginationReturn => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  // Reset page when dependencies change
  useEffect(() => {
    setCurrentPage(1);
  }, dependencies);
  
  // 🚀 OTIMIZAÇÃO: Memoizar cálculos de paginação
  const paginationData = useMemo((): Omit<PaginationData, 'currentPage'> => {
    const totalPages = Math.ceil(auctions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAuctions = auctions.slice(startIndex, endIndex);
    
    return {
      totalPages,
      currentAuctions,
      totalItems: auctions.length
    };
  }, [auctions, itemsPerPage, currentPage]);
  
  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return {
    currentPage,
    totalPages: paginationData.totalPages,
    currentAuctions: paginationData.currentAuctions,
    handlePageChange
  };
};