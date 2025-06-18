import { useState, useEffect } from 'react';
import { auctions } from '../lib/database';
import { FilterOption } from '../types/auction';

/**
 * Hook para buscar opções dinâmicas de veículos (marcas, modelos, cores)
 * Substitui as listas hardcoded por dados reais do banco
 */
export const useVehicleOptions = () => {
  const [brands, setBrands] = useState<FilterOption[]>([]);
  const [models, setModels] = useState<FilterOption[]>([]);
  const [colors, setColors] = useState<FilterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar marcas na inicialização
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setLoading(true);
        const brandsData = await auctions.getVehicleBrands();
        
        const brandOptions: FilterOption[] = [
          { value: "all", label: "Todas as marcas" },
          ...brandsData.map(brand => ({
            value: brand.toLowerCase().replace(/\s+/g, '-'),
            label: brand
          }))
        ];
        
        setBrands(brandOptions);
      } catch (err) {
        console.error('Erro ao buscar marcas:', err);
        setError('Erro ao carregar marcas');
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  // Buscar cores na inicialização
  useEffect(() => {
    const fetchColors = async () => {
      try {
        const colorsData = await auctions.getVehicleColors();
        
        const colorOptions: FilterOption[] = [
          { value: "all", label: "Todas as cores" },
          ...colorsData.map(color => ({
            value: color.toLowerCase().replace(/\s+/g, '-'),
            label: color
          }))
        ];
        
        setColors(colorOptions);
      } catch (err) {
        console.error('Erro ao buscar cores:', err);
        setError('Erro ao carregar cores');
      }
    };

    fetchColors();
  }, []);

  // Função para buscar modelos por marca
  const fetchModels = async (selectedBrand: string) => {
    if (!selectedBrand || selectedBrand === 'all') {
      setModels([{ value: "all", label: "Todos os modelos" }]);
      return;
    }

    try {
      // Converter slug de volta para nome real da marca
      const brandName = brands.find(b => b.value === selectedBrand)?.label;
      if (!brandName) return;

      const modelsData = await auctions.getVehicleModels(brandName);
      
      const modelOptions: FilterOption[] = [
        { value: "all", label: "Todos os modelos" },
        ...modelsData.map(model => ({
          value: model.toLowerCase().replace(/\s+/g, '-'),
          label: model
        }))
      ];
      
      setModels(modelOptions);
    } catch (err) {
      console.error('Erro ao buscar modelos:', err);
      setError('Erro ao carregar modelos');
    }
  };

  return {
    brands,
    models,
    colors,
    loading,
    error,
    fetchModels
  };
};
