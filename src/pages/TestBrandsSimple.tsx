import React from 'react';
import { useVehicleOptions } from '../hooks/useVehicleOptions';

const TestBrandsSimple: React.FC = () => {
  const { brands, colors, loading, error } = useVehicleOptions();

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            🚗 Teste Simples de Marcas
          </h1>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">Status</h2>
              <p><strong>Loading:</strong> {loading ? 'Sim' : 'Não'}</p>
              <p><strong>Error:</strong> {error ? error.message : 'Nenhum'}</p>
              <p><strong>Total de marcas:</strong> {brands.length}</p>
              <p><strong>Total de cores:</strong> {colors.length}</p>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="text-lg font-semibold text-green-800 mb-2">Marcas Híbridas (Fixas + Banco)</h2>
              <p className="text-sm text-green-700 mb-3">
                Mostra apenas marcas da lista fixa que existem no banco de dados
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {brands.slice(0, 20).map((brand, index) => (
                  <div key={index} className="p-2 bg-white rounded border">
                    <strong>{brand.value}</strong>: {brand.label}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">Últimas 20 Marcas</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {brands.slice(-20).map((brand, index) => (
                  <div key={index} className="p-2 bg-white rounded border">
                    <strong>{brand.value}</strong>: {brand.label}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h2 className="text-lg font-semibold text-purple-800 mb-2">Marcas após letra C</h2>
              <div className="grid grid-cols-2 gap-2 text-sm max-h-60 overflow-y-auto">
                {brands
                  .filter(brand => brand.label && brand.label.toLowerCase().charAt(0) > 'c')
                  .map((brand, index) => (
                    <div key={index} className="p-2 bg-white rounded border">
                      <strong>{brand.value}</strong>: {brand.label}
                    </div>
                  ))}
              </div>
            </div>

            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h2 className="text-lg font-semibold text-orange-800 mb-2">Cores Híbridas (Fixas + Banco)</h2>
              <p className="text-sm text-orange-700 mb-3">
                Mostra apenas cores da lista fixa que existem no banco de dados
              </p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {colors.map((color, index) => (
                  <div key={index} className="p-2 bg-white rounded border">
                    <strong>{color.value}</strong>: {color.label}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Todas as Marcas (JSON)</h2>
              <pre className="text-xs bg-white p-2 rounded border max-h-40 overflow-y-auto">
                {JSON.stringify(brands, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestBrandsSimple;
