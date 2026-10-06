export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
  screen: 20,
  tabPad: 96,
} as const

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const

export const type = {
  eyebrow: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 1.6,
    // Avoid Android applying the device locale (for example Turkish İ) to English UI copy.
    textTransform: 'none' as const,
  },
  title: {
    fontSize: 30,
    fontWeight: '600' as const,
    letterSpacing: -0.4,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
}
