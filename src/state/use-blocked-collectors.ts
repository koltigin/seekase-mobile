import { useQuery } from '@tanstack/react-query'
import { listBlockedCollectorIds } from '../repositories/moderation-repository'

const noBlockedCollectors: string[] = []

export function useBlockedCollectors(userId?: string) {
  const query = useQuery({
    queryKey: ['blocked-collectors', userId],
    enabled: Boolean(userId),
    retry: false,
    queryFn: async () => {
      const result = await listBlockedCollectorIds(userId!)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  return { ...query, blockedIds: query.data ?? noBlockedCollectors }
}
