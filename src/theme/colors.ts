export type ThemeColors = {
  background: string
  surface: string
  surfaceElevated: string
  ink: string
  muted: string
  faint: string
  line: string
  chip: string
  chipActive: string
  like: string
  overlay: string
  accent: string
  danger: string
  tabBar: string
  onAccent: string
}

export const lightColors: ThemeColors = {
  background: '#F4F0E8',
  surface: '#FBF8F2',
  surfaceElevated: '#FFFCF6',
  ink: '#1A1713',
  muted: '#6B655C',
  faint: '#8F887E',
  line: '#E6E0D4',
  chip: '#EDE7DB',
  chipActive: '#1A1713',
  like: '#8A4A3A',
  overlay: 'rgba(20,16,12,0.28)',
  accent: '#1A1713',
  danger: '#8A4A3A',
  tabBar: '#FBF8F2',
  onAccent: '#FBF8F2',
}

export const darkColors: ThemeColors = {
  background: '#161310',
  surface: '#221E19',
  surfaceElevated: '#2B261F',
  ink: '#F3EEE4',
  muted: '#B4ADA2',
  faint: '#8B8479',
  line: '#3A342C',
  chip: '#2E2923',
  chipActive: '#F3EEE4',
  like: '#C47B6A',
  overlay: 'rgba(8,6,4,0.4)',
  accent: '#F3EEE4',
  danger: '#C47B6A',
  tabBar: '#1C1915',
  onAccent: '#161310',
}

/** Light fallback for modules that cannot hook into theme. Prefer useTheme(). */
export const colors = lightColors
