import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  updateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

interface ServiceWorkerActions {
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  update: () => Promise<void>;
  cacheUrls: (urls: string[]) => void;
}

// 🚀 HOOK PARA GERENCIAR SERVICE WORKER
export const useServiceWorker = (): ServiceWorkerState & ServiceWorkerActions => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isOnline: navigator.onLine,
    updateAvailable: false,
    registration: null,
  });

  // 🔥 REGISTRAR SERVICE WORKER
  const register = async (): Promise<void> => {
    if (!state.isSupported) {
      console.warn('⚠️ Service Worker não suportado neste browser');
      return;
    }

    try {
      console.log('🚀 Registrando Service Worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none' // Sempre verificar atualizações
      });

      console.log('✅ Service Worker registrado:', registration.scope);

      setState(prev => ({
        ...prev,
        isRegistered: true,
        registration
      }));

      // 🔥 VERIFICAR ATUALIZAÇÕES
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 Nova versão do Service Worker disponível');
              setState(prev => ({ ...prev, updateAvailable: true }));
            }
          });
        }
      });

      // 🔥 VERIFICAR ATUALIZAÇÕES PERIODICAMENTE
      setInterval(() => {
        registration.update();
      }, 60000); // Verificar a cada 1 minuto

    } catch (error) {
      console.error('❌ Erro ao registrar Service Worker:', error);
    }
  };

  // 🔥 DESREGISTRAR SERVICE WORKER
  const unregister = async (): Promise<void> => {
    if (!state.registration) return;

    try {
      const result = await state.registration.unregister();
      
      if (result) {
        console.log('🗑️ Service Worker desregistrado');
        setState(prev => ({
          ...prev,
          isRegistered: false,
          registration: null,
          updateAvailable: false
        }));
      }
    } catch (error) {
      console.error('❌ Erro ao desregistrar Service Worker:', error);
    }
  };

  // 🔥 ATUALIZAR SERVICE WORKER
  const update = async (): Promise<void> => {
    if (!state.registration) return;

    try {
      await state.registration.update();
      
      // Forçar ativação da nova versão
      if (state.registration.waiting) {
        state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        // Recarregar página após ativação
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar Service Worker:', error);
    }
  };

  // 🔥 CACHE URLs ESPECÍFICAS
  const cacheUrls = (urls: string[]): void => {
    if (!state.registration || !state.registration.active) {
      console.warn('⚠️ Service Worker não ativo para cache de URLs');
      return;
    }

    state.registration.active.postMessage({
      type: 'CACHE_URLS',
      urls
    });

    console.log('📦 Solicitado cache de URLs:', urls);
  };

  // 🔥 MONITORAR STATUS ONLINE/OFFLINE
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      console.log('🌐 Aplicação online');
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      console.log('📴 Aplicação offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 🔥 AUTO-REGISTRAR EM DESENVOLVIMENTO E PRODUÇÃO
  useEffect(() => {
    if (state.isSupported) {
      console.log('🚀 Service Worker suportado, registrando...');
      register();
    } else {
      console.warn('⚠️ Service Worker não suportado neste browser');
    }
  }, [state.isSupported]);

  return {
    ...state,
    register,
    unregister,
    update,
    cacheUrls
  };
};

// 🚀 HOOK PARA NOTIFICAÇÃO DE ATUALIZAÇÃO
export const useServiceWorkerUpdate = () => {
  const { updateAvailable, update } = useServiceWorker();
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  useEffect(() => {
    if (updateAvailable) {
      setShowUpdatePrompt(true);
    }
  }, [updateAvailable]);

  const handleUpdate = async () => {
    await update();
    setShowUpdatePrompt(false);
  };

  const dismissUpdate = () => {
    setShowUpdatePrompt(false);
  };

  return {
    showUpdatePrompt,
    handleUpdate,
    dismissUpdate
  };
};

// 🚀 HOOK PARA STATUS OFFLINE
export const useOfflineStatus = () => {
  const { isOnline } = useServiceWorker();
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOfflineMessage(true);
      
      // Auto-hide após 5 segundos
      const timer = setTimeout(() => {
        setShowOfflineMessage(false);
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setShowOfflineMessage(false);
    }
  }, [isOnline]);

  return {
    isOnline,
    showOfflineMessage,
    dismissOfflineMessage: () => setShowOfflineMessage(false)
  };
};
