// Test script to debug vehicle brands query
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lsuyvkybrmddtsanvmvw.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdXl2a3licm1kZHRzYW52bXZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzQsImV4cCI6MjA1MDU0ODk3NH0.Ej_qJOQGGJJOKJOQGGJJOKJOQGGJJOKJOQGGJJOKJOQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testVehicleBrands() {
  console.log('🚗 Testando query de marcas de veículos...');
  
  try {
    // Query exata do código atual
    const { data, error } = await supabase
      .from('lots_vehicle')
      .select('brand')
      .not('brand', 'is', null)
      .neq('brand', '')
      .order('brand');

    if (error) {
      console.error('❌ Erro na query:', error);
      return;
    }

    console.log('✅ Query executada com sucesso');
    console.log('📊 Total de registros retornados:', data?.length || 0);
    
    if (data && data.length > 0) {
      // Extrair marcas únicas
      const allBrands = data.map(item => item.brand).filter(Boolean);
      const uniqueBrands = [...new Set(allBrands)];
      
      console.log('📊 Total de marcas únicas:', uniqueBrands.length);
      console.log('🔤 Primeiras 20 marcas:', uniqueBrands.slice(0, 20));
      console.log('🔤 Últimas 20 marcas:', uniqueBrands.slice(-20));
      
      // Verificar se há marcas após a letra C
      const brandsAfterC = uniqueBrands.filter(brand => 
        brand.toLowerCase().charAt(0) > 'c'
      );
      
      console.log('🔍 Marcas após letra C:', brandsAfterC.length);
      console.log('🔍 Algumas marcas após C:', brandsAfterC.slice(0, 10));
      
      // Verificar distribuição por letra
      const distribution = {};
      uniqueBrands.forEach(brand => {
        const firstLetter = brand.charAt(0).toUpperCase();
        distribution[firstLetter] = (distribution[firstLetter] || 0) + 1;
      });
      
      console.log('📈 Distribuição por letra:', distribution);
    }
    
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
  }
}

// Executar teste
testVehicleBrands();
