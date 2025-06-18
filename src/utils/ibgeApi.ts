import { IBGEEstado, IBGEMunicipio, FilterOption } from '../types/auction';

/**
 * Busca os municípios de um estado específico via API do IBGE
 */
export async function fetchMunicipiosByEstado(uf: string): Promise<IBGEMunicipio[]> {
  try {
    const response = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
    );
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar municípios: ${response.status}`);
    }
    
    const data: unknown = await response.json();
    
    // Validar e mapear dados da API
    if (!Array.isArray(data)) {
      throw new Error('Resposta da API não é um array');
    }
    
    // Mapear para o formato esperado e ordenar alfabeticamente
    return data
      .filter((item): item is { id: number; nome: string } => 
        typeof item === 'object' && 
        item !== null && 
        typeof (item as Record<string, unknown>).id === 'number' &&
        typeof (item as Record<string, unknown>).nome === 'string'
      )
      .map((municipio): IBGEMunicipio => ({
        id: municipio.id,
        nome: municipio.nome
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
      
  } catch (error) {
    console.error('Erro ao buscar municípios:', error);
    return [];
  }
}

/**
 * Converte lista de estados para formato do ComboBox
 * CORREÇÃO: Usar "all" em vez de "" para a opção "Todos os estados"
 */
export function getEstadosOptions(): FilterOption[] {
  return [
    { value: "all", label: "Todos os estados" }, // Mudou de "" para "all"
    ...ESTADOS_BRASIL.map((estado): FilterOption => ({
      value: estado.sigla,
      label: `${estado.nome} (${estado.sigla})`
    }))
  ];
}

/**
 * Converte lista de municípios para formato do ComboBox
 * CORREÇÃO: Usar "all" em vez de "" para a opção "Todas as cidades"
 */
export function getMunicipiosOptions(municipios: IBGEMunicipio[]): FilterOption[] {
  return [
    { value: "all", label: "Todas as cidades" }, // Mudou de "" para "all"
    ...municipios.map((municipio): FilterOption => ({
      value: municipio.nome,
      label: municipio.nome
    }))
  ];
}

// Estados fixos do Brasil
export const ESTADOS_BRASIL: IBGEEstado[] = [
  { id: 12, sigla: 'AC', nome: 'Acre' },
  { id: 27, sigla: 'AL', nome: 'Alagoas' },
  { id: 16, sigla: 'AP', nome: 'Amapá' },
  { id: 13, sigla: 'AM', nome: 'Amazonas' },
  { id: 29, sigla: 'BA', nome: 'Bahia' },
  { id: 23, sigla: 'CE', nome: 'Ceará' },
  { id: 53, sigla: 'DF', nome: 'Distrito Federal' },
  { id: 32, sigla: 'ES', nome: 'Espírito Santo' },
  { id: 52, sigla: 'GO', nome: 'Goiás' },
  { id: 21, sigla: 'MA', nome: 'Maranhão' },
  { id: 51, sigla: 'MT', nome: 'Mato Grosso' },
  { id: 50, sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { id: 31, sigla: 'MG', nome: 'Minas Gerais' },
  { id: 15, sigla: 'PA', nome: 'Pará' },
  { id: 25, sigla: 'PB', nome: 'Paraíba' },
  { id: 41, sigla: 'PR', nome: 'Paraná' },
  { id: 26, sigla: 'PE', nome: 'Pernambuco' },
  { id: 22, sigla: 'PI', nome: 'Piauí' },
  { id: 33, sigla: 'RJ', nome: 'Rio de Janeiro' },
  { id: 24, sigla: 'RN', nome: 'Rio Grande do Norte' },
  { id: 43, sigla: 'RS', nome: 'Rio Grande do Sul' },
  { id: 11, sigla: 'RO', nome: 'Rondônia' },
  { id: 14, sigla: 'RR', nome: 'Roraima' },
  { id: 42, sigla: 'SC', nome: 'Santa Catarina' },
  { id: 35, sigla: 'SP', nome: 'São Paulo' },
  { id: 28, sigla: 'SE', nome: 'Sergipe' },
  { id: 17, sigla: 'TO', nome: 'Tocantins' }
];

// Re-export types for convenience
export type { IBGEEstado, IBGEMunicipio };