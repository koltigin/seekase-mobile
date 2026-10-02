import { useQuery } from '@tanstack/react-query'
import { getActivityLastReadAt, listAccountActivity } from '../repositories/activity-repository'

export function useActivityUnread(userId?: string) {
  const activityQuery = useQuery({
    queryKey: ['account-activity', userId],
    enabled: Boolean(userId),
    retry: false,
    queryFn: async () => {
      const result = await listAccountActivity(userId!)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const readQuery = useQuery({
    queryKey: ['account-activity-read', userId],
    enabled: Boolean(userId),
    retry: false,
    queryFn: async () => {
      const result = await getActivityLastReadAt(userId!)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const lastReadAt = readQuery.data
  const unreadCount = activityQuery.data?.filter((event) => !lastReadAt || event.createdAt > lastReadAt).length ?? 0
  return { unreadCount, activityQuery, readQuery }
}
