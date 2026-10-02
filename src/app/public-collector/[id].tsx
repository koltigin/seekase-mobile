import { ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { AccountPhoto } from '../../components/catalog/account-photo'
import { CloudButton } from '../../components/catalog/cloud-controls'
import { Screen } from '../../components/ui/screen'
import { SafetyActions } from '../../components/safety/safety-actions'
import { ProgressBadges } from '../../components/profile/progress-badges'
import { MessageCollectorButton } from '../../components/messages/message-collector-button'
import { ProfileAvatar } from '../../components/profile/profile-avatar'
import { categoryLabel } from '../../data/categories'
import { getPublicCollector } from '../../repositories/discover-repository'
import { useTheme } from '../../state/app-state'
import { useAuth } from '../../state/auth'
import { radius, type } from '../../theme/tokens'

export default function CloudPublicCollectorScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const collectorId = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const { colors } = useTheme()
  const { user } = useAuth()
  const query = useQuery({
    queryKey: ['public-collector', collectorId],
    enabled: Boolean(collectorId),
    retry: false,
    queryFn: async () => {
      const result = await getPublicCollector(collectorId!)
      if (!result.ok) throw new Error(result.error.message)
      if (!result.data) throw new Error('This collector profile is no longer available.')
      return result.data
    },
  })

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 90 }} showsVerticalScrollIndicator={false}>
        <CloudButton label="Back" secondary onPress={() => router.back()} />
        {query.isPending ? <Text style={{ ...type.body, color: colors.muted }}>Loading collector…</Text> : null}
        {query.isError ? (
          <View style={{ gap: 14 }}>
            <Text accessibilityRole="alert" style={{ ...type.body, color: colors.danger }}>
              {query.error.message}
            </Text>
            <CloudButton label="Try again" secondary onPress={() => void query.refetch()} />
          </View>
        ) : null}
        {query.data ? (
          <>
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 10 }}>
              <ProfileAvatar
                path={query.data.avatarPath}
                initials={query.data.displayName
                  .split(/\s+/u)
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
                color={colors.surface}
              />
              <Text style={{ ...type.title, fontSize: 28, color: colors.ink }}>{query.data.displayName}</Text>
              <Text style={{ ...type.body, color: colors.muted }}>@{query.data.handle}</Text>
              {query.data.location ? (
                <Text style={{ ...type.meta, color: colors.faint }}>{query.data.location}</Text>
              ) : null}
              {query.data.bio ? (
                <Text style={{ ...type.body, color: colors.muted, textAlign: 'center' }}>{query.data.bio}</Text>
              ) : null}
              <ProgressBadges
                collectionCount={query.data.collections.length}
                itemCount={query.data.collections.reduce((sum, collection) => sum + collection.itemCount, 0)}
                badgeIds={query.data.badgeIds}
                showHeading={false}
                compact
              />
            </View>
            {user && user.id !== query.data.id ? <MessageCollectorButton peerId={query.data.id} /> : null}
            <Text style={{ ...type.title, fontSize: 24, color: colors.ink }}>Collections</Text>
            {query.data.collections.length === 0 ? (
              <Text style={{ ...type.body, color: colors.muted }}>This collector has no public collections yet.</Text>
            ) : (
              query.data.collections.map((collection) => (
                <View
                  key={collection.id}
                  style={{ overflow: 'hidden', borderRadius: radius.lg, backgroundColor: colors.surface }}
                >
                  <View style={{ height: 170, justifyContent: 'center', backgroundColor: colors.line }}>
                    {collection.coverPath ? (
                      <AccountPhoto path={collection.coverPath} compact fill />
                    ) : (
                      <Text style={{ ...type.body, color: colors.muted, textAlign: 'center' }}>
                        {categoryLabel(collection.categoryId)}
                      </Text>
                    )}
                  </View>
                  <View style={{ gap: 5, padding: 15 }}>
                    <Text style={{ ...type.body, fontWeight: '600', color: colors.ink }}>{collection.title}</Text>
                    <Text style={{ ...type.meta, color: colors.muted }}>
                      {categoryLabel(collection.categoryId)} · {collection.itemCount}{' '}
                      {collection.itemCount === 1 ? 'object' : 'objects'}
                    </Text>
                    <CloudButton
                      label="Open collection"
                      secondary
                      onPress={() => router.push(`/showcase/${collection.id}`)}
                    />
                  </View>
                </View>
              ))
            )}
            {user && user.id !== query.data.id ? (
              <SafetyActions
                userId={user.id}
                targetType="profile"
                targetId={query.data.id}
                collectorId={query.data.id}
              />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  )
}
