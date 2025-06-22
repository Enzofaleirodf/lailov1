/**
 * 🧹 UTILITÁRIO PARA LIMPAR CACHE CORROMPIDO
 * 
 * Este arquivo contém funções para limpar completamente o cache
 * que pode estar causando problemas com filtros dinâmicos
 */

export const clearCorruptedCache = (): void => {
  try {
    console.log('🧹 Limpando cache corrompido...');
    
    // 1. Limpar localStorage
    const localStorageKeys = Object.keys(localStorage);
    localStorageKeys.forEach(key => {
      if (
        key.startsWith('lailo-') ||
        key.startsWith('buscador-') ||
        key.includes('vehicle-brands') ||
        key.includes('react-query') ||
        key.includes('cache')
      ) {
        localStorage.removeItem(key);
        console.log(`🗑️ Removido do localStorage: ${key}`);
      }
    });
    
    // 2. Limpar sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage);
    sessionStorageKeys.forEach(key => {
      if (
        key.startsWith('lailo-') ||
        key.startsWith('buscador-') ||
        key.includes('vehicle-brands') ||
        key.includes('react-query') ||
        key.includes('cache')
      ) {
        sessionStorage.removeItem(key);
        console.log(`🗑️ Removido do sessionStorage: ${key}`);
      }
    });
    
    console.log('✅ Cache corrompido limpo com sucesso!');
    
    // 3. Forçar reload da página para garantir estado limpo
    if (typeof window !== 'undefined') {
      console.log('🔄 Recarregando página para aplicar mudanças...');
      window.location.reload();
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
  }
};

export const clearVehicleBrandsCache = (): void => {
  try {
    console.log('🚗 Limpando cache específico de marcas de veículos...');
    
    // Limpar chaves específicas de marcas
    const keysToRemove = [
      'lailo-react-query-cache',
      'lailo-advanced-cache-filters-vehicle-brands',
      'buscador-cache-vehicle-brands'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
      console.log(`🗑️ Removido: ${key}`);
    });
    
    // Limpar qualquer chave que contenha 'vehicle-brands'
    [...Object.keys(localStorage), ...Object.keys(sessionStorage)].forEach(key => {
      if (key.includes('vehicle-brands')) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
        console.log(`🗑️ Removido cache de marcas: ${key}`);
      }
    });
    
    console.log('✅ Cache de marcas limpo!');
    
  } catch (error) {
    console.error('❌ Erro ao limpar cache de marcas:', error);
  }
};

// Função para executar automaticamente na inicialização se necessário
export const autoCleanCorruptedCache = (): void => {
  try {
    // Verificar se há indicadores de cache corrompido
    const hasCorruptedCache = localStorage.getItem('lailo-cache-corrupted') === 'true';
    
    if (hasCorruptedCache) {
      console.log('🚨 Cache corrompido detectado, limpando automaticamente...');
      clearCorruptedCache();
      localStorage.removeItem('lailo-cache-corrupted');
    }
    
  } catch (error) {
    console.error('❌ Erro na limpeza automática de cache:', error);
  }
};

// Marcar cache como corrompido para limpeza na próxima inicialização
export const markCacheAsCorrupted = (): void => {
  try {
    localStorage.setItem('lailo-cache-corrupted', 'true');
    console.log('🚨 Cache marcado como corrompido');
  } catch (error) {
    console.error('❌ Erro ao marcar cache como corrompido:', error);
  }
};
