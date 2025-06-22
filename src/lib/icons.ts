// 🚀 OTIMIZAÇÃO: Imports específicos de ícones para reduzir bundle size
// Em vez de importar toda a biblioteca lucide-react, importamos apenas os ícones necessários

// ===== NAVIGATION ICONS =====
export { 
  Car,
  Building,
  Heart,
  User,
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

// ===== ACTION ICONS =====
export {
  ArrowUpRight,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Download,
  Upload,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react';

// ===== STATUS ICONS =====
export {
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  Loader2,
  Clock,
  Calendar,
  MapPin,
  Star,
  Bookmark,
  Eye,
  EyeOff
} from 'lucide-react';

// ===== CONTENT ICONS =====
export {
  Image,
  FileText,
  File,
  Folder,
  FolderOpen,
  Mail,
  Phone,
  Globe,
  Link,
  Tag,
  Hash,
  AtSign,
  MessageCircle,
  Bell,
  BellOff
} from 'lucide-react';

// ===== UTILITY ICONS =====
export {
  Settings,
  MoreHorizontal,
  MoreVertical,
  Grid,
  List,
  Columns,
  Rows,
  Maximize,
  Minimize,
  Expand,
  Shrink,
  Move,
  Grip,
  GripVertical,
  GripHorizontal
} from 'lucide-react';

// ===== MEDIA ICONS =====
export {
  Play,
  Pause,
  Stop,
  SkipForward,
  SkipBack,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  Camera,
  Video,
  Mic,
  MicOff
} from 'lucide-react';

// ===== BUSINESS ICONS =====
export {
  DollarSign,
  CreditCard,
  Wallet,
  Receipt,
  Calculator,
  TrendingUp,
  TrendingDown,
  BarChart,
  PieChart,
  Activity,
  Target,
  Award,
  Trophy,
  Medal,
  Crown
} from 'lucide-react';

// ===== SYSTEM ICONS =====
export {
  Wifi,
  WifiOff,
  Signal,
  Battery,
  BatteryLow,
  Power,
  PowerOff,
  Refresh,
  RefreshCw,
  RotateCw,
  Zap,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Key
} from 'lucide-react';

// 🚀 ICON MAPPING: Mapeamento para facilitar uso
export const ICONS = {
  // Navigation
  car: Car,
  building: Building,
  heart: Heart,
  user: User,
  search: Search,
  menu: Menu,
  close: X,
  
  // Arrows
  left: ChevronLeft,
  right: ChevronRight,
  down: ChevronDown,
  up: ChevronUp,
  
  // Actions
  external: ArrowUpRight,
  filter: Filter,
  sliders: SlidersHorizontal,
  reset: RotateCcw,
  check: Check,
  plus: Plus,
  minus: Minus,
  
  // Status
  alert: AlertCircle,
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
  loading: Loader2,
  clock: Clock,
  calendar: Calendar,
  location: MapPin,
  
  // Content
  image: Image,
  file: FileText,
  folder: Folder,
  mail: Mail,
  phone: Phone,
  globe: Globe,
  link: Link,
  tag: Tag,
  
  // Utility
  settings: Settings,
  more: MoreHorizontal,
  moreVertical: MoreVertical,
  grid: Grid,
  list: List,
  
  // Business
  dollar: DollarSign,
  card: CreditCard,
  wallet: Wallet,
  trending: TrendingUp,
  chart: BarChart,
  target: Target,
  
  // System
  wifi: Wifi,
  signal: Signal,
  battery: Battery,
  power: Power,
  refresh: Refresh,
  shield: Shield,
  lock: Lock
} as const;

// 🚀 TYPE EXPORTS
export type IconName = keyof typeof ICONS;
export type IconComponent = typeof Car; // Tipo base para ícones

// 🚀 HELPER FUNCTION: Obter ícone por nome
export const getIcon = (name: IconName): IconComponent => {
  return ICONS[name];
};

// 🚀 ICON SIZES: Tamanhos padronizados
export const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10'
} as const;

export type IconSize = keyof typeof ICON_SIZES;

// 🚀 ICON COMPONENT: Componente wrapper para ícones
interface IconProps {
  name: IconName;
  size?: IconSize;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 'md', 
  className = '' 
}) => {
  const IconComponent = getIcon(name);
  const sizeClass = ICON_SIZES[size];
  
  return (
    <IconComponent 
      className={`${sizeClass} ${className}`}
    />
  );
};
