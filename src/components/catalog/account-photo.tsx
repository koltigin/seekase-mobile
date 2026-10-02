import { useState } from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { signedItemPhoto } from '../../repositories/photo-repository'
import { useTheme } from '../../state/app-state'
import { radius } from '../../theme/tokens'

export function AccountPhoto({
  path,
  compact = false,
  fill = false,
}: {
  path?: string
  compact?: boolean
  fill?: boolean
}) {
  const { colors } = useTheme()
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const query = useQuery({
    queryKey: ['account-photo', path],
    queryFn: () => signedItemPhoto(path!),
    enabled: Boolean(path),
    staleTime: 40 * 60 * 1000,
    refetchInterval: 45 * 60 * 1000,
    retry: false,
  })
  if (!path) return null
  return (
    <View
      style={{
        height: fill ? '100%' : compact ? 150 : 280,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        overflow: 'hidden',
      }}
    >
      {query.data && query.data !== failedUrl ? (
        <Image
          accessibilityLabel="Collection photo"
          source={{ uri: query.data }}
          resizeMode={compact ? 'cover' : 'contain'}
          style={{ width: '100%', height: '100%' }}
          onError={() => setFailedUrl(query.data ?? null)}
        />
      ) : (
        <Pressable
          accessibilityRole="button"
          disabled={query.isFetching}
          onPress={() =>
            void query.refetch().then((result) => {
              if (!result.isError) setFailedUrl(null)
            })
          }
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text style={{ color: colors.muted }}>
            {query.isFetching ? 'Loading photo…' : 'Photo unavailable · Retry'}
          </Text>
        </Pressable>
      )}
    </View>
  )
}
