import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 space-y-8">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center shadow-inner">
              <svg
                className="w-12 h-12 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.291-1.007-5.691-2.709M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
          </div>

          {/* Error Content */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">
              Página não encontrada
            </h1>
            <p className="text-gray-600 leading-relaxed">
              A página que você está procurando não existe ou foi movida. 
              Verifique o endereço ou retorne à página inicial.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Tentar Novamente
            </button>
            
            <Link
              to="/buscador/imoveis/todos"
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center justify-center"
            >
              Voltar ao Início
            </Link>
          </div>

          {/* Error Code */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs uppercase tracking-wide text-gray-500">
              Código de erro: 404 • Suporte: contato@lailo.com.br
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
