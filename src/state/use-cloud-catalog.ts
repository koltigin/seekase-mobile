import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PhotoDraft } from '../services/pick-photo'
import { uploadItemPhoto } from '../repositories/photo-repository'
import { requireCloudAccount } from '../repositories/cloud-access'
import { unwrapRepo } from '../services/cloud-catalog'
import { changeCloudCatalog, loadCloudCatalog, type CloudCatalogAction } from '../services/cloud-catalog'

export function useCloudCatalog(ownerId: string) {
  const client = useQueryClient()
  const [uploading, setUploading] = useState(false)
  const activeWrite = useRef<AbortController | null>(null)
  const uploaded = useRef(new Map<string, string>())
  const queryKey = ['account-catalog', ownerId]
  const query = useQuery({
    queryKey,
    queryFn: ({ signal }) => loadCloudCatalog(ownerId, signal),
    retry: false,
    networkMode: 'always',
    staleTime: 0,
  })
  const mutation = useMutation({
    mutationFn: ({ action, signal }: { action: CloudCatalogAction; signal: AbortSignal }) =>
      changeCloudCatalog(ownerId, action, signal),
    retry: false,
    networkMode: 'always',
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['account-catalog', ownerId] })
    },
  })

  useEffect(
    () => () => {
      activeWrite.current?.abort()
    },
    [],
  )

  async function change(action: CloudCatalogAction, photo?: PhotoDraft) {
    // Ref guard closes the gap before React renders the pending state.
    if (activeWrite.current) return null
    const controller = new AbortController()
    activeWrite.current = controller
    setUploading(true)
    try {
      if (
        photo &&
        (action.kind === 'create-item' || action.kind === 'create-ungrouped-item' || action.kind === 'update-item')
      ) {
        unwrapRepo(await requireCloudAccount(ownerId, controller.signal))
        let path = uploaded.current.get(photo.id)
        if (!path) {
          path = await uploadItemPhoto(ownerId, photo.id, photo.bytes, controller.signal)
          uploaded.current.set(photo.id, path)
        }
        if (action.kind === 'create-item') action = { ...action, input: { ...action.input, coverPath: path } }
        else if (action.kind === 'create-ungrouped-item')
          action = { ...action, input: { ...action.input, coverPath: path } }
        else action = { ...action, input: { ...action.input, coverPath: path } }
      }
      return await mutation.mutateAsync({ action, signal: controller.signal })
    } finally {
      activeWrite.current = null
      setUploading(false)
    }
  }

  return { query, change, busy: uploading || mutation.isPending }
}
