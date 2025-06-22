import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface BrandTest {
  fixedBrand: string;
  dbBrand: string | null;
  hasMatch: boolean;
  recordCount: number;
}

const TestBrandMatching: React.FC = () => {
  const [results, setResults] = useState<BrandTest[]>([]);
  const [loading, setLoading] = useState(true);

  const FIXED_BRANDS = [
    'Agrale', 'Alfa Romeo', 'Americar', 'Asia', 'Aston Martin', 'Audi', 'Austin-healey', 'Avallone',
    'Bentley', 'BMW', 'Brm', 'Bugre', 'Bugway', 'BYD', 'Cadillac', 'Caoa Chery', 'Cbt', 'Chamonix',
    'Chevrolet', 'Chrysler', 'Citroën', 'Daewoo', 'Daihatsu', 'Dkw-vemag', 'Dodge', 'Effa', 'Ego',
    'Emis', 'Engesa', 'Envemo', 'Farus', 'Fercar Buggy', 'Ferrari', 'Fever', 'Fiat', 'Fnm', 'Ford',
    'Fyber', 'Geely', 'Giants', 'GMC', 'Gurgel', 'GWM', 'Hafei', 'Honda', 'Hummer', 'Hyundai',
    'Infiniti', 'International', 'Iveco', 'JAC', 'Jaecoo', 'Jaguar', 'Jeep', 'Jinbei', 'Jpx', 'Kaiser',
    'Kia', 'Lada', 'Lamborghini', 'Land Rover', 'Lexus', 'Lifan', 'Lincoln', 'Lotus', 'Lucid',
    'Mahindra', 'Marcopolo', 'Maserati', 'Matra', 'Mazda', 'Mclaren', 'Mercedes-Benz', 'Mercury',
    'Mg', 'Mini', 'Mitsubishi', 'Miura', 'Morgan', 'Morris', 'Mp Lafer', 'Mplm', 'Nash', 'Neta',
    'Nissan', 'Oldsmobile', 'Omoda', 'Opel', 'Packard', 'Peugeot', 'Plymouth', 'Pontiac', 'Porsche',
    'Puma', 'Ram', 'Renault', 'Rivian', 'Rolls-royce', 'Santa Matilde', 'Saturn', 'Seat', 'Seres',
    'Shelby', 'Shineray', 'Smart', 'Ssangyong', 'Studebaker', 'Subaru', 'Suzuki', 'Tac', 'Tesla',
    'Toyota', 'Troller', 'Volkswagen', 'Volvo', 'Wake', 'Way Brasil', 'Willys', 'Willys Overland', 'Zeekr'
  ];

  useEffect(() => {
    testBrandMatching();
  }, []);

  const testBrandMatching = async () => {
    const testResults: BrandTest[] = [];

    try {
      // Buscar todas as marcas do banco
      const { data: dbBrands, error } = await supabase
        .from('lots_vehicle')
        .select('brand')
        .not('brand', 'is', null)
        .neq('brand', '');

      if (error) {
        console.error('Erro ao buscar marcas:', error);
        return;
      }

      const uniqueDbBrands = [...new Set(dbBrands.map(item => item.brand))];
      
      // Testar cada marca fixa
      for (const fixedBrand of FIXED_BRANDS) {
        const dbMatch = uniqueDbBrands.find(dbBrand => 
          dbBrand.toLowerCase().trim() === fixedBrand.toLowerCase().trim()
        );

        // Contar registros para esta marca
        const { data: countData, error: countError } = await supabase
          .from('lots_vehicle')
          .select('id', { count: 'exact' })
          .eq('brand', dbMatch || fixedBrand);

        const recordCount = countError ? 0 : (countData?.length || 0);

        testResults.push({
          fixedBrand,
          dbBrand: dbMatch || null,
          hasMatch: !!dbMatch,
          recordCount
        });
      }

      setResults(testResults);
    } catch (error) {
      console.error('Erro no teste:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">🧪 Testando Correspondência de Marcas...</h3>
        <p className="text-blue-600">Verificando se marcas fixas correspondem ao banco...</p>
      </div>
    );
  }

  const mismatches = results.filter(r => !r.hasMatch);
  const matches = results.filter(r => r.hasMatch);
  const zeroRecords = results.filter(r => r.hasMatch && r.recordCount === 0);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            🧪 Teste de Correspondência de Marcas
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800">✅ Correspondências</h3>
              <p className="text-2xl font-bold text-green-600">{matches.length}</p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800">❌ Sem Correspondência</h3>
              <p className="text-2xl font-bold text-red-600">{mismatches.length}</p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800">⚠️ Zero Registros</h3>
              <p className="text-2xl font-bold text-yellow-600">{zeroRecords.length}</p>
            </div>
          </div>

          {mismatches.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">❌ Marcas sem correspondência:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {mismatches.map((result, index) => (
                  <div key={index} className="p-2 bg-white rounded border">
                    {result.fixedBrand}
                  </div>
                ))}
              </div>
            </div>
          )}

          {zeroRecords.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Marcas com zero registros:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {zeroRecords.map((result, index) => (
                  <div key={index} className="p-2 bg-white rounded border">
                    {result.fixedBrand}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">✅ Marcas funcionais (com registros):</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm max-h-60 overflow-y-auto">
              {matches
                .filter(r => r.recordCount > 0)
                .map((result, index) => (
                  <div key={index} className="p-2 bg-white rounded border">
                    <strong>{result.fixedBrand}</strong>
                    <br />
                    <span className="text-xs text-gray-600">{result.recordCount} registros</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestBrandMatching;
