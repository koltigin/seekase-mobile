export type SocialProvider = 'instagram' | 'youtube' | 'tiktok' | 'x' | 'website'

export type SocialLinks = Partial<Record<SocialProvider, string>>

export const socialProviders: { id: SocialProvider; label: string; placeholder: string }[] = [
  { id: 'instagram', label: 'Instagram', placeholder: '@handle or url' },
  { id: 'youtube', label: 'YouTube', placeholder: '@handle or url' },
  { id: 'tiktok', label: 'TikTok', placeholder: '@handle or url' },
  { id: 'x', label: 'X', placeholder: '@handle or url' },
  { id: 'website', label: 'Website', placeholder: 'https://' },
]

export function normalizeSocial(provider: SocialProvider, raw: string) {
  const value = raw.trim()
  if (!value) {
    return ''
  }
  if (provider === 'website') {
    if (/^https?:\/\//i.test(value)) {
      return value
    }
    return `https://${value}`
  }
  return value.replace(/^@/, '')
}

export function socialHref(provider: SocialProvider, value: string) {
  const handle = value.replace(/^@/, '')
  switch (provider) {
    case 'instagram':
      return value.startsWith('http') ? value : `https://instagram.com/${handle}`
    case 'youtube':
      return value.startsWith('http') ? value : `https://youtube.com/@${handle}`
    case 'tiktok':
      return value.startsWith('http') ? value : `https://tiktok.com/@${handle}`
    case 'x':
      return value.startsWith('http') ? value : `https://x.com/${handle}`
    case 'website':
      return normalizeSocial('website', value)
  }
}
