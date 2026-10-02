import { useState } from 'react'
import { Image, Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { signedAvatarPhoto } from '../../repositories/avatar-repository'

export function ProfileAvatar({
  path,
  initials,
  color,
  size = 96,
}: {
  path?: string
  initials: string
  color: string
  size?: number
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ['profile-avatar', path],
    queryFn: () => signedAvatarPhoto(path!),
    enabled: Boolean(path),
    staleTime: 40 * 60 * 1000,
    retry: false,
  })
  const style = { width: size, height: size, borderRadius: size / 2 }
  if (query.data && query.data !== failedUrl) {
    return (
      <Image
        accessibilityLabel="Collector profile photo"
        source={{ uri: query.data }}
        resizeMode="cover"
        style={style}
        onError={() => setFailedUrl(query.data ?? null)}
      />
    )
  }
  return (
    <View style={{ ...style, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#FBF8F2', fontSize: size * 0.34, fontWeight: '600' }}>{initials}</Text>
    </View>
  )
}
