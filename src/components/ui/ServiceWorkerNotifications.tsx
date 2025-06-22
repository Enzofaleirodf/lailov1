import React from 'react';
import { Download, Wifi, WifiOff, X } from 'lucide-react';
import { useServiceWorkerUpdate, useOfflineStatus } from '../../hooks/useServiceWorker';

// 🚀 COMPONENTE DE NOTIFICAÇÃO DE ATUALIZAÇÃO
export const UpdateNotification: React.FC = () => {
  const { showUpdatePrompt, handleUpdate, dismissUpdate } = useServiceWorkerUpdate();

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-auction-600 text-white rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Download className="w-5 h-5 mt-0.5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">
            Nova versão disponível
          </h4>
          <p className="text-auction-100 text-xs mt-1">
            Uma nova versão da aplicação está disponível. Atualize para obter as últimas melhorias.
          </p>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleUpdate}
              className="bg-white text-auction-600 px-3 py-1.5 rounded text-xs font-medium hover:bg-auction-50 transition-colors"
            >
              Atualizar
            </button>
            <button
              onClick={dismissUpdate}
              className="text-auction-100 hover:text-white px-3 py-1.5 rounded text-xs transition-colors"
            >
              Depois
            </button>
          </div>
        </div>
        
        <button
          onClick={dismissUpdate}
          className="flex-shrink-0 text-auction-200 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// 🚀 COMPONENTE DE NOTIFICAÇÃO OFFLINE
export const OfflineNotification: React.FC = () => {
  const { isOnline, showOfflineMessage, dismissOfflineMessage } = useOfflineStatus();

  if (!showOfflineMessage) return null;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 rounded-lg shadow-lg p-4 max-w-sm animate-in slide-in-from-top-2 ${
      isOnline
        ? 'bg-success-600 text-white'
        : 'bg-orange-600 text-white'
    }`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {isOnline ? (
            <Wifi className="w-5 h-5" />
          ) : (
            <WifiOff className="w-5 h-5" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {isOnline ? (
              'Conexão restaurada'
            ) : (
              'Modo offline'
            )}
          </p>
          <p className={`text-xs mt-1 ${
            isOnline ? 'text-success-100' : 'text-orange-100'
          }`}>
            {isOnline ? (
              'Você está online novamente. Dados serão sincronizados.'
            ) : (
              'Você está offline. Algumas funcionalidades podem estar limitadas.'
            )}
          </p>
        </div>
        
        <button
          onClick={dismissOfflineMessage}
          className={`flex-shrink-0 transition-colors ${
            isOnline
              ? 'text-success-200 hover:text-white'
              : 'text-orange-200 hover:text-white'
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// 🚀 COMPONENTE COMBINADO DE NOTIFICAÇÕES
export const ServiceWorkerNotifications: React.FC = () => {
  return (
    <>
      <UpdateNotification />
      <OfflineNotification />
    </>
  );
};

// 🚀 INDICADOR DE STATUS OFFLINE (PARA HEADER)
export const OfflineIndicator: React.FC = () => {
  const { isOnline } = useOfflineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-orange-500 text-white px-3 py-1 text-xs font-medium flex items-center gap-2">
      <WifiOff className="w-3 h-3" />
      <span>Offline</span>
    </div>
  );
};
