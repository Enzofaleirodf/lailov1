import { 
  Auction, 
  Category, 
  SortOption, 
  Filters, 
  AuctionSearchResult
} from '../types/auction';
import { processAuctions } from '../services/auctionService';

export const mockAuctions: Auction[] = [
  // IMÓVEIS - Apartamentos
  {
    _id: "1",
    type: "property",
    image: "https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800",
    property_type: "Apartamento",
    useful_area_m2: 85,
    property_address: "Av. Paulista, 1000",
    city: "São Paulo",
    state: "SP",
    initial_bid_value: 180000,
    appraised_value: 220000,
    origin: "Judicial",
    stage: "1ª Praça",
    end_date: "2025-07-25T16:00:00.000Z", // Data futura
    href: "https://example.com/leilao1",
    website: "Leiloeira ABC",
    website_image: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200",
    updated: "2025-06-15T12:00:00.000Z",
    data_scraped: "2025-06-17T12:00:00.000Z", // Hoje para badge "Novo"
    docs: ["Matrícula", "Condomínio"],
    format: "Presencial"
  },
  {
    _id: "2",
    type: "property",
    image: "https://images.pexels.com/photos/280222/pexels-photo-280222.jpeg?auto=compress&cs=tinysrgb&w=800",
    property_type: "Casa",
    useful_area_m2: 250,
    property_address: "Rua das Flores, 123",
    city: "Rio de Janeiro",
    state: "RJ",
    initial_bid_value: 450000,
    appraised_value: 600000,
    origin: "Judicial",
    stage: "1ª Praça",
    end_date: "2025-07-28T14:00:00.000Z", // Data futura
    href: "https://example.com/leilao2",
    website: "Leiloeira DEF",
    website_image: "https://images.pexels.com/photos/3184293/pexels-photo-3184293.jpeg?auto=compress&cs=tinysrgb&w=200",
    updated: "2025-06-15T15:20:00.000Z",
    data_scraped: "2025-06-16T15:20:00.000Z",
    docs: ["Matrícula", "IPTU"],
    format: "Online"
  },
  {
    _id: "3",
    type: "property",
    image: "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800",
    property_type: "Terreno",
    useful_area_m2: 500,
    property_address: "Rua do Campo, 789",
    city: "Curitiba",
    state: "PR",
    initial_bid_value: 120000,
    appraised_value: 150000,
    origin: "Extrajudicial",
    stage: "1ª Praça",
    end_date: "2025-08-01T09:00:00.000Z", // Data futura
    href: "https://example.com/leilao3",
    website: "Leiloeira MNO",
    website_image: "https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=200",
    updated: "2025-06-15T07:20:00.000Z",
    data_scraped: "2025-06-15T07:20:00.000Z",
    docs: ["Matrícula", "Certidões"],
    format: "Presencial"
  },
  {
    _id: "4",
    type: "property",
    image: "https://images.pexels.com/photos/416320/pexels-photo-416320.jpeg?auto=compress&cs=tinysrgb&w=800",
    property_type: "Comercial",
    useful_area_m2: 300,
    property_address: "Rua do Comércio, 456",
    city: "Belo Horizonte",
    state: "MG",
    initial_bid_value: 280000,
    appraised_value: 350000,
    origin: "Judicial",
    stage: "2ª Praça",
    end_date: "2025-08-05T16:00:00.000Z", // Data futura
    href: "https://example.com/leilao4",
    website: "Leiloeira JKL",
    website_image: "https://images.pexels.com/photos/3184295/pexels-photo-3184295.jpeg?auto=compress&cs=tinysrgb&w=200",
    updated: "2025-06-14T14:10:00.000Z",
    data_scraped: "2025-06-14T14:10:00.000Z",
    docs: ["Matrícula", "Alvará"],
    format: "Online"
  },
  {
    _id: "5",
    type: "property",
    image: "https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=800",
    property_type: "Galpão",
    useful_area_m2: 800,
    property_address: "Distrito Industrial, 100",
    city: "Porto Alegre",
    state: "RS",
    initial_bid_value: 450000,
    appraised_value: 580000,
    origin: "Judicial",
    stage: "3ª Praça",
    end_date: "2025-08-10T15:00:00.000Z", // Data futura
    href: "https://example.com/leilao5",
    website: "Leiloeira PQR",
    website_image: "https://images.pexels.com/photos/3184297/pexels-photo-3184297.jpeg?auto=compress&cs=tinysrgb&w=200",
    updated: "2025-06-16T11:30:00.000Z",
    data_scraped: "2025-06-17T11:30:00.000Z", // Hoje para badge "Novo"
    docs: ["Matrícula", "Alvará", "Bombeiros"],
    format: "Híbrido"
  },

  // VEÍCULOS - Carros
  {
    _id: "6",
    type: "vehicle",
    image: "https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=800",
    vehicle_type: "Carro",
    brand: "Toyota",
    model: "Corolla",
    color: "Prata",
    year: 2020,
    city: "São Paulo",
    state: "SP",
    initial_bid_value: 45000,
    appraised_value: 60000,
    origin: "Extrajudicial",
    stage: "2ª Praça",
    end_date: "2025-07-28T14:00:00.000Z", // Data futura
    href: "https://example.com/leilao6",
    website: "Leiloeira AUTO",
    website_image: "https://images.pexels.com/photos/3184298/pexels-photo-3184298.jpeg?auto=compress&cs=tinysrgb&w=200",
    updated: "2025-06-14T10:30:00.000Z",
    data_scraped: "2025-06-14T10:30:00.000Z",
    docs: ["Documento do Veículo", "Laudo"],
    format: "Online"
  },
  {
    _id: "7",
    type: "vehicle",
    image: "https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800",
    vehicle_type: "Carro",
    brand: "Honda",
    model: "Civic",
    color: "Azul",
    year: 2019,
    city: "Rio de Janeiro",
    state: "RJ",
    initial_bid_value: 38000,
    appraised_value: 50000,
    origin: "Judicial",
    stage: "1ª Praça",
    end_date: "2025-08-01T11:00:00.000Z", // Data futura
    href: "https://example.com/leilao7",
    website: "Leiloeira VEÍCULOS",
    website_image: "https://images.pexels.com/photos/3184299/pexels-photo-3184299.jpeg?auto=compress&cs=tinysrgb&w=200",
    updated: "2025-06-15T16:45:00.000Z",
    data_scraped: "2025-06-15T16:45:00.000Z",
    docs: ["Documento do Veículo"],
    format: "Presencial"
  },
  {
    _id: "8",
    type: "vehicle",
    image: "https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg?auto=compress&cs=tinysrgb&w=800",
    vehicle_type: "Carro",
    brand: "Volkswagen",
    model: "Golf",
    color: "Branco",
    year: 2021,
    city: "Belo Horizonte",
    state: "MG",
    initial_bid_value: 52000,
    appraised_value: 68000,
    origin: "Particular",
    stage: "Praça única",
    end_date: "2025-08-05T10:00:00.000Z", // Data futura
    href: "https://example.com/leilao8",
    website: "Leiloeira PREMIUM",
    website_image: "https://images.pexels.com/photos/3184300/pexels-photo-3184300.jpeg?auto=compress&cs=tinysrgb&w=200",
    updated: "2025-06-16T13:20:00.000Z",
    data_scraped: "2025-06-17T13:20:00.000Z", // Hoje para badge "Novo"
    docs: ["Documento do Veículo", "Manual"],
    format: "Híbrido"
  },

  // VEÍCULOS - Motos
  {
    _id: "9",
    type: "vehicle",
    image: "https://images.pexels.com/photos/163210/motorcycles-race-helmets-pilots-163210.jpeg?auto=compress&cs=tinysrgb&w=800",
    vehicle_type: "Moto",
    brand: "Honda",
    model: "CB 600F",
    color: "Vermelho",
    year: 2019,
    city: "Curitiba",
    state: "PR",
    initial_bid_value: 15000,
    appraised_value: 20000,
    origin: "Extrajudicial",
    stage: "1ª Praça",
    end_date: "2025-08-01T11:00:00.000Z", // Data futura
    href: "https://example.com/leilao9",
    website: "Leiloeira MOTOS",
    website_image: "https://images.pexels.com/photos/3184301/pexels-photo-3184301.jpeg?auto=compress&cs=tinysrgb&w=200",
    updated: "2025-06-13T15:45:00.000Z",
    data_scraped: "2025-06-13T15:45:00.000Z",
    docs: ["Documento do Veículo"],
    format: "Presencial"
  },
  {
    _id: "10",
    type: "vehicle",
    image: "https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800",
    vehicle_type: "Moto",
    brand: "Yamaha",
    model: "MT-07",
    color: "Preto",
    year: 2020,
    city: "Porto Alegre",
    state: "RS",
    initial_bid_value: 18000,
    appraised_value: 24000,
    origin: "Judicial",
    stage: "2ª Praça",
    end_date: "2025-08-10T14:30:00.000Z", // Data futura
    href: "https://example.com/leilao10",
    website: "Leiloeira SUL",
    website_image: "https://images.pexels.com/photos/3184302/pexels-photo-3184302.jpeg?auto=compress&cs=tinysrgb&w=200",
    updated: "2025-06-15T09:15:00.000Z",
    data_scraped: "2025-06-15T09:15:00.000Z",
    docs: ["Documento do Veículo", "Laudo"],
    format: "Online"
  },

  // VEÍCULOS - Caminhões
  {
    _id: "11",
    type: "vehicle",
    image: "https://images.pexels.com/photos/1335077/pexels-photo-1335077.jpeg?auto=compress&cs=tinysrgb&w=800",
    vehicle_type: "Caminhão",
    brand: "Mercedes-Benz",
    model: "Atego 1719",
    color: "Branco",
    year: 2018,
    city: "São Paulo",
    state: "SP",
    initial_bid_value: 85000,
    appraised_value: 110000,
    origin: "Judicial",
    stage: "1ª Praça",
    end_date: "2025-08-15T16:00:00.000Z", // Data futura
    href: "https://example.com/leilao11",
    website: "Leiloeira PESADOS",
    website_image: "https://images.pexels.com/photos/3184303/pexels-photo-3184303.jpeg?auto=compress&cs=tinysrgb&w=200",
    updated: "2025-06-16T14:00:00.000Z",
    data_scraped: "2025-06-16T14:00:00.000Z",
    docs: ["Documento do Veículo", "Tacógrafo"],
    format: "Presencial"
  },

  // VEÍCULOS - Ônibus
  {
    _id: "12",
    type: "vehicle",
    image: "https://images.pexels.com/photos/1335077/pexels-photo-1335077.jpeg?auto=compress&cs=tinysrgb&w=800",
    vehicle_type: "Ônibus",
    brand: "Mercedes-Benz",
    model: "OF-1721",
    color: "Branco",
    year: 2016,
    city: "Salvador",
    state: "BA",
    initial_bid_value: 95000,
    appraised_value: 125000,
    origin: "Público",
    stage: "1ª Praça",
    end_date: "2025-08-20T15:00:00.000Z", // Data futura
    href: "https://example.com/leilao12",
    website: "Leiloeira NORDESTE",
    website_image: "https://images.pexels.com/photos/3184305/pexels-photo-3184305.jpeg?auto=compress&cs=tinysrgb&w=200",
    updated: "2025-06-15T12:45:00.000Z",
    data_scraped: "2025-06-15T12:45:00.000Z",
    docs: ["Documento do Veículo", "ANTT"],
    format: "Híbrido"
  },

  // VEÍCULOS - Máquinas
  {
    _id: "13",
    type: "vehicle",
    image: "https://images.pexels.com/photos/1335077/pexels-photo-1335077.jpeg?auto=compress&cs=tinysrgb&w=800",
    vehicle_type: "Máquina",
    brand: "Caterpillar",
    model: "320D",
    color: "Amarelo",
    year: 2015,
    city: "Goiânia",
    state: "GO",
    initial_bid_value: 180000,
    appraised_value: 230000,
    origin: "Judicial",
    stage: "3ª Praça",
    end_date: "2025-08-25T10:00:00.000Z", // Data futura
    href: "https://example.com/leilao13",
    website: "Leiloeira MÁQUINAS",
    website_image: "https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=200",
    updated: "2025-06-14T08:20:00.000Z",
    data_scraped: "2025-06-14T08:20:00.000Z",
    docs: ["Documento do Veículo", "Manual"],
    format: "Presencial"
  },

  // VEÍCULOS - Apoio (ex-reboques)
  {
    _id: "14",
    type: "vehicle",
    image: "https://images.pexels.com/photos/1335077/pexels-photo-1335077.jpeg?auto=compress&cs=tinysrgb&w=800",
    vehicle_type: "Reboque",
    brand: "Randon",
    model: "SR 2E",
    color: "Cinza",
    year: 2019,
    city: "Caxias do Sul",
    state: "RS",
    initial_bid_value: 35000,
    appraised_value: 45000,
    origin: "Extrajudicial",
    stage: "1ª Praça",
    end_date: "2025-08-30T13:00:00.000Z", // Data futura
    href: "https://example.com/leilao14",
    website: "Leiloeira APOIO",
    website_image: "https://images.pexels.com/photos/3184307/pexels-photo-3184307.jpeg?auto=compress&cs=tinysrgb&w=200",
    updated: "2025-06-16T10:15:00.000Z",
    data_scraped: "2025-06-16T10:15:00.000Z",
    docs: ["Documento do Veículo"],
    format: "Online"
  },

  // VEÍCULOS - Embarcações
  {
    _id: "15",
    type: "vehicle",
    image: "https://images.pexels.com/photos/1335077/pexels-photo-1335077.jpeg?auto=compress&cs=tinysrgb&w=800",
    vehicle_type: "Embarcação",
    brand: "Yamaha",
    model: "Lancha 24 pés",
    color: "Branco",
    year: 2018,
    city: "Santos",
    state: "SP",
    initial_bid_value: 65000,
    appraised_value: 85000,
    origin: "Particular",
    stage: "Praça única",
    end_date: "2025-09-01T16:30:00.000Z", // Data futura
    href: "https://example.com/leilao15",
    website: "Leiloeira NÁUTICA",
    website_image: "https://images.pexels.com/photos/3184308/pexels-photo-3184308.jpeg?auto=compress&cs=tinysrgb&w=200",
    updated: "2025-06-15T14:30:00.000Z",
    data_scraped: "2025-06-15T14:30:00.000Z",
    docs: ["Documento da Embarcação", "Marinha"],
    format: "Presencial"
  }
];

/**
 * Função principal simplificada - agora apenas chama o service
 */
export function getAuctionsByCategory(
  category: Category,
  type?: string,
  filters?: Filters,
  sort?: SortOption,
  searchQuery?: string
): AuctionSearchResult {
  return processAuctions(mockAuctions, category, type, filters, sort, searchQuery);
}