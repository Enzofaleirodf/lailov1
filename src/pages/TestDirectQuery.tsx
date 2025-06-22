import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface TestResult {
  method: string;
  success: boolean;
  count: number;
  data: any[];
  error?: string;
}

const TestDirectQuery: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDirectTests();
  }, []);

  const runDirectTests = async () => {
    const testResults: TestResult[] = [];
    
    try {
      // Test 1: Marcas sem limite
      console.log('🧪 Test 1: Marcas sem limite');
      try {
        const { data, error } = await supabase
          .from('lots_vehicle')
          .select('brand')
          .not('brand', 'is', null)
          .neq('brand', '')
          .order('brand');

        if (error) throw error;

        const uniqueBrands = [...new Set(data.map(item => item.brand).filter(Boolean))];

        testResults.push({
          method: 'Marcas sem limite',
          success: true,
          count: uniqueBrands.length,
          data: uniqueBrands
        });
      } catch (err) {
        testResults.push({
          method: 'Marcas sem limite',
          success: false,
          count: 0,
          data: [],
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Test 2: Marcas com limite 10000
      console.log('🧪 Test 2: Marcas com limite 10000');
      try {
        const { data, error } = await supabase
          .from('lots_vehicle')
          .select('brand')
          .not('brand', 'is', null)
          .neq('brand', '')
          .order('brand')
          .limit(10000);

        if (error) throw error;

        const uniqueBrands = [...new Set(data.map(item => item.brand).filter(Boolean))];

        testResults.push({
          method: 'Marcas com limite 10000',
          success: true,
          count: uniqueBrands.length,
          data: uniqueBrands
        });
      } catch (err) {
        testResults.push({
          method: 'Marcas com limite 10000',
          success: false,
          count: 0,
          data: [],
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Test 3: Cores sem limite
      console.log('🧪 Test 3: Cores sem limite');
      try {
        const { data, error } = await supabase
          .from('lots_vehicle')
          .select('color')
          .not('color', 'is', null)
          .neq('color', '')
          .order('color');

        if (error) throw error;

        const uniqueColors = [...new Set(data.map(item => item.color).filter(Boolean))];

        testResults.push({
          method: 'Cores sem limite',
          success: true,
          count: uniqueColors.length,
          data: uniqueColors
        });
      } catch (err) {
        testResults.push({
          method: 'Cores sem limite',
          success: false,
          count: 0,
          data: [],
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Test 4: Cores com limite 10000
      console.log('🧪 Test 4: Cores com limite 10000');
      try {
        const { data, error } = await supabase
          .from('lots_vehicle')
          .select('color')
          .not('color', 'is', null)
          .neq('color', '')
          .order('color')
          .limit(10000);

        if (error) throw error;

        const uniqueColors = [...new Set(data.map(item => item.color).filter(Boolean))];

        testResults.push({
          method: 'Cores com limite 10000',
          success: true,
          count: uniqueColors.length,
          data: uniqueColors
        });
      } catch (err) {
        testResults.push({
          method: 'Cores com limite 10000',
          success: false,
          count: 0,
          data: [],
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }

    } catch (err) {
      console.error('Error running tests:', err);
    }

    setResults(testResults);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🧪 Executando Testes Diretos...</h3>
        <p className="text-blue-600">Testando queries diretas no Supabase...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            🧪 Teste de Queries Diretas
          </h1>
          
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg mb-4 ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <h3 className="font-semibold text-lg mb-2">
                {result.success ? '✅' : '❌'} {result.method}
              </h3>
              
              {result.success ? (
                <div className="space-y-2">
                  <p><strong>Total únicos:</strong> {result.count}</p>
                  
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">Ver todos os dados</summary>
                    <div className="mt-2 max-h-40 overflow-y-auto bg-white p-2 border rounded text-sm">
                      {result.data.map((item, i) => (
                        <div key={i} className="py-1 border-b border-gray-100">
                          {item}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ) : (
                <p className="text-red-600">
                  <strong>Error:</strong> {result.error}
                </p>
              )}
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">🔍 Análise</h3>
            <ul className="space-y-1 text-sm text-gray-600">
              <li>• Se "sem limite" e "com limite" retornam contagens diferentes, há limitação padrão</li>
              <li>• Se ambos retornam a mesma contagem baixa, o problema está na query ou dados</li>
              <li>• Se ambos retornam contagem alta, o problema está no processamento frontend</li>
              <li>• Esperado: Marcas 200+, Cores 17+</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDirectQuery;
