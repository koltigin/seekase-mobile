import { useQuery } from '@tanstack/react-query'
import { listDirectConversations } from '../repositories/message-repository'

export function useMessageInbox(userId?: string) {
  const inboxQuery = useQuery({
    queryKey: ['direct-conversations', userId],
    enabled: Boolean(userId),
    retry: false,
    queryFn: async () => {
      const result = await listDirectConversations(userId!)
      if (!result.ok) throw new Error(result.error.message)
      return result.data
    },
  })
  const unreadCount = inboxQuery.data?.reduce((total, conversation) => total + conversation.unreadCount, 0) ?? 0
  return { inboxQuery, unreadCount }
}
