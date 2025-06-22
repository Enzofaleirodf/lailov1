import { supabase } from '../lib/supabase';

export const testSupabaseLimits = async () => {
  console.log('🧪 [SUPABASE-TEST] Iniciando testes de limitação...');
  
  try {
    // Test 1: Query básica sem modificadores
    console.log('🧪 Test 1: Query básica');
    const test1 = await supabase
      .from('lots_vehicle')
      .select('brand')
      .not('brand', 'is', null)
      .neq('brand', '');
    
    console.log('🧪 Test 1 Result:', {
      count: test1.data?.length || 0,
      error: test1.error,
      firstFew: test1.data?.slice(0, 5)?.map(item => item.brand) || []
    });

    // Test 2: Com order
    console.log('🧪 Test 2: Com order');
    const test2 = await supabase
      .from('lots_vehicle')
      .select('brand')
      .not('brand', 'is', null)
      .neq('brand', '')
      .order('brand');
    
    console.log('🧪 Test 2 Result:', {
      count: test2.data?.length || 0,
      error: test2.error,
      firstFew: test2.data?.slice(0, 5)?.map(item => item.brand) || [],
      lastFew: test2.data?.slice(-5)?.map(item => item.brand) || []
    });

    // Test 3: Com limit explícito baixo
    console.log('🧪 Test 3: Com limit 50');
    const test3 = await supabase
      .from('lots_vehicle')
      .select('brand')
      .not('brand', 'is', null)
      .neq('brand', '')
      .order('brand')
      .limit(50);
    
    console.log('🧪 Test 3 Result:', {
      count: test3.data?.length || 0,
      error: test3.error,
      lastBrand: test3.data?.[test3.data.length - 1]?.brand || 'N/A'
    });

    // Test 4: Com limit explícito alto
    console.log('🧪 Test 4: Com limit 10000');
    const test4 = await supabase
      .from('lots_vehicle')
      .select('brand')
      .not('brand', 'is', null)
      .neq('brand', '')
      .order('brand')
      .limit(10000);
    
    console.log('🧪 Test 4 Result:', {
      count: test4.data?.length || 0,
      error: test4.error,
      lastBrand: test4.data?.[test4.data.length - 1]?.brand || 'N/A'
    });

    // Test 5: Processar marcas únicas do Test 2
    if (test2.data) {
      const uniqueBrands = [...new Set(test2.data.map(item => item.brand).filter(Boolean))];
      console.log('🧪 Test 5: Marcas únicas do Test 2:', {
        totalRecords: test2.data.length,
        uniqueBrands: uniqueBrands.length,
        brandsAfterC: uniqueBrands.filter(brand => brand.toLowerCase().charAt(0) > 'c').length,
        firstFew: uniqueBrands.slice(0, 10),
        lastFew: uniqueBrands.slice(-10)
      });
    }

    // Test 6: Processar marcas únicas do Test 4
    if (test4.data) {
      const uniqueBrands = [...new Set(test4.data.map(item => item.brand).filter(Boolean))];
      console.log('🧪 Test 6: Marcas únicas do Test 4:', {
        totalRecords: test4.data.length,
        uniqueBrands: uniqueBrands.length,
        brandsAfterC: uniqueBrands.filter(brand => brand.toLowerCase().charAt(0) > 'c').length,
        firstFew: uniqueBrands.slice(0, 10),
        lastFew: uniqueBrands.slice(-10)
      });
    }

    // Test 7: Cores
    console.log('🧪 Test 7: Cores');
    const test7 = await supabase
      .from('lots_vehicle')
      .select('color')
      .not('color', 'is', null)
      .neq('color', '')
      .order('color');
    
    if (test7.data) {
      const uniqueColors = [...new Set(test7.data.map(item => item.color).filter(Boolean))];
      console.log('🧪 Test 7 Result:', {
        totalRecords: test7.data.length,
        uniqueColors: uniqueColors.length,
        allColors: uniqueColors
      });
    }

    return {
      test1: test1.data?.length || 0,
      test2: test2.data?.length || 0,
      test3: test3.data?.length || 0,
      test4: test4.data?.length || 0,
      uniqueBrandsTest2: test2.data ? [...new Set(test2.data.map(item => item.brand).filter(Boolean))].length : 0,
      uniqueBrandsTest4: test4.data ? [...new Set(test4.data.map(item => item.brand).filter(Boolean))].length : 0,
      uniqueColors: test7.data ? [...new Set(test7.data.map(item => item.color).filter(Boolean))].length : 0
    };

  } catch (error) {
    console.error('❌ [SUPABASE-TEST] Erro nos testes:', error);
    return null;
  }
};

// Função para executar no console do navegador
(window as any).testSupabaseLimits = testSupabaseLimits;
