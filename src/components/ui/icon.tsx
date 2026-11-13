import {
  AlertCircle,
  Archive,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  BadgeCheck,
  Bookmark,
  BookOpen,
  Brain,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Globe,
  Home,
  Info,
  Layers,
  ListChecks,
  LogOut,
  type LucideIcon,
  Menu,
  Pencil,
  Play,
  Plus,
  PlusCircle,
  Save,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  TriangleAlert,
  User,
  Volume2,
  X,
} from "lucide-react";

/**
 * Registro centralizado de íconos semánticos de DolyNation respaldado por `lucide-react`.
 */
const ICON_REGISTRY = {
  home: Home,
  "book-open": BookOpen,
  "plus-circle": PlusCircle,
  user: User,
  sparkles: Sparkles,
  flame: Flame,
  bookmark: Bookmark,
  settings: Settings,
  menu: Menu,
  close: X,
  eye: Eye,
  "eye-off": EyeOff,
  check: Check,
  "check-circle": CircleCheck,
  "alert-circle": AlertCircle,
  "alert-triangle": TriangleAlert,
  info: Info,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  "chevron-down": ChevronDown,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  search: Search,
  "volume-2": Volume2,
  "log-out": LogOut,
  calendar: Calendar,
  sliders: SlidersHorizontal,
  brain: Brain,
  pencil: Pencil,
  globe: Globe,
  clock: Clock,
  plus: Plus,
  play: Play,
  save: Save,
  "arrow-up-down": ArrowUpDown,
  "file-text": FileText,
  archive: Archive,
  "badge-check": BadgeCheck,
  "list-checks": ListChecks,
  layers: Layers,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICON_REGISTRY;

export type IconSize = "xs" | "sm" | "md" | "lg";

const SIZE_CLASSES: Record<IconSize, string> = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export interface IconProps {
  /** Identificador semántico del ícono dentro del catálogo oficial. */
  name: IconName;
  /** Escala visual estándar del trazo. */
  size?: IconSize;
  /** Clases Tailwind adicionales para ajuste contextual. */
  className?: string;
  /** Grosor del trazo vectorial monocromático. */
  strokeWidth?: number;
  /** Etiqueta accesible cuando el ícono no es meramente decorativo. */
  label?: string;
}

/**
 * Lista de nombres disponibles para documentación e inspección en el catálogo UI.
 */
export const AVAILABLE_ICON_NAMES = Object.keys(ICON_REGISTRY) as IconName[];

/**
 * Componente único de iconografía del sistema de diseño DolyNation.
 * Encapsula `lucide-react` para que ninguna vista dependa directamente del paquete externo.
 */
export function Icon({
  name,
  size = "md",
  className = "",
  strokeWidth = 1.75,
  label,
}: IconProps) {
  const LucideComponent = ICON_REGISTRY[name];
  const isDecorative = !label;

  return (
    <LucideComponent
      aria-hidden={isDecorative ? true : undefined}
      aria-label={label}
      role={isDecorative ? undefined : "img"}
      strokeWidth={strokeWidth}
      className={`shrink-0 ${SIZE_CLASSES[size]} ${className}`.trim()}
    />
  );
}
