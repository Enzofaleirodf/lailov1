import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface BrandTestResult {
  method: string;
  success: boolean;
  count: number;
  brandsAfterC: number;
  error?: string;
  brands?: string[];
}

export const BrandsDebugComponent: React.FC = () => {
  const [results, setResults] = useState<BrandTestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runAllTests();
  }, []);

  const runAllTests = async () => {
    const testResults: BrandTestResult[] = [];
    
    try {
      // Test 1: Direct Supabase query
      console.log('🧪 Test 1: Direct Supabase query');
      try {
        const { data, error } = await supabase
          .from('lots_vehicle')
          .select('brand')
          .not('brand', 'is', null)
          .neq('brand', '')
          .order('brand');

        if (error) throw error;

        const uniqueBrands = [...new Set(data.map(item => item.brand).filter(Boolean))];
        const brandsAfterC = uniqueBrands.filter(brand => brand.toLowerCase().charAt(0) > 'c');

        testResults.push({
          method: 'Direct Supabase',
          success: true,
          count: uniqueBrands.length,
          brandsAfterC: brandsAfterC.length,
          brands: uniqueBrands
        });
      } catch (err) {
        testResults.push({
          method: 'Direct Supabase',
          success: false,
          count: 0,
          brandsAfterC: 0,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Test 2: Using database module
      console.log('🧪 Test 2: Using database module');
      try {
        const { auctions } = await import('../../lib/database');
        const brands = await auctions.getVehicleBrands();
        const brandsAfterC = brands.filter(brand => brand.toLowerCase().charAt(0) > 'c');

        testResults.push({
          method: 'Database Module',
          success: true,
          count: brands.length,
          brandsAfterC: brandsAfterC.length,
          brands: brands
        });
      } catch (err) {
        testResults.push({
          method: 'Database Module',
          success: false,
          count: 0,
          brandsAfterC: 0,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      // Test 3: Using React Query hook
      console.log('🧪 Test 3: Using React Query hook');
      try {
        const { useVehicleOptions } = await import('../../hooks/useVehicleOptions');
        // Note: This would need to be called within a component with React Query provider
        testResults.push({
          method: 'React Query Hook',
          success: false,
          count: 0,
          brandsAfterC: 0,
          error: 'Cannot test hook outside component tree'
        });
      } catch (err) {
        testResults.push({
          method: 'React Query Hook',
          success: false,
          count: 0,
          brandsAfterC: 0,
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
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🧪 Running Brands Debug Tests...</h3>
        <p className="text-blue-600">Testing different methods to fetch vehicle brands...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">🚗 Vehicle Brands Debug Results</h2>
      
      {results.map((result, index) => (
        <div
          key={index}
          className={`p-4 border rounded-lg ${
            result.success 
              ? result.brandsAfterC > 0 
                ? 'bg-green-50 border-green-200' 
                : 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <h3 className="font-semibold text-lg mb-2">
            {result.success ? '✅' : '❌'} {result.method}
          </h3>
          
          {result.success ? (
            <div className="space-y-2">
              <p><strong>Total brands:</strong> {result.count}</p>
              <p><strong>Brands after C:</strong> {result.brandsAfterC}</p>
              
              {result.brandsAfterC === 0 && (
                <p className="text-yellow-700 font-medium">
                  ⚠️ WARNING: No brands found after letter C!
                </p>
              )}
              
              {result.brands && (
                <details className="mt-2">
                  <summary className="cursor-pointer font-medium">View all brands</summary>
                  <div className="mt-2 max-h-40 overflow-y-auto bg-white p-2 border rounded text-sm">
                    {result.brands.map((brand, i) => (
                      <div key={i} className={brand.toLowerCase().charAt(0) > 'c' ? 'text-green-600' : ''}>
                        {brand}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ) : (
            <p className="text-red-600">
              <strong>Error:</strong> {result.error}
            </p>
          )}
        </div>
      ))}
      
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">🔍 Analysis</h3>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>• If "Direct Supabase" works but others fail, the issue is in the app layer</li>
          <li>• If all methods show brands after C = 0, the issue is in the database or query</li>
          <li>• If counts differ between methods, there's a processing issue</li>
          <li>• Expected: 100+ brands with 50+ brands after letter C</li>
        </ul>
      </div>
    </div>
  );
};
