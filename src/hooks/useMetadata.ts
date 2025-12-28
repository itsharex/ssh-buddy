import { useState, useEffect, useCallback } from 'react'
import {
  readMetadata,
  setHostMetadata,
  addHostTags,
  removeHostTags,
  toggleHostFavorite,
  updateLastUsed,
  deleteHostMetadata,
  renameHostMetadata,
  createTag,
  deleteTag,
  renameTag,
  completeOnboarding,
  skipOnboarding,
  isFirstRun,
  markFirstRun,
  type MetadataStore,
  type HostMetadata,
  type AppMetadata,
} from '@/lib/metadata-service'

interface UseMetadataReturn {
  // State
  metadata: MetadataStore | null
  loading: boolean
  error: string | null

  // Host metadata
  getHostMeta: (hostAlias: string) => HostMetadata | null
  setHostMeta: (hostAlias: string, meta: Partial<HostMetadata>) => Promise<void>
  addTags: (hostAlias: string, tags: string[]) => Promise<void>
  removeTags: (hostAlias: string, tags: string[]) => Promise<void>
  toggleFavorite: (hostAlias: string) => Promise<boolean>
  markUsed: (hostAlias: string) => Promise<void>
  deleteHostMeta: (hostAlias: string) => Promise<void>
  renameHostMeta: (oldAlias: string, newAlias: string) => Promise<void>

  // Tags
  allTags: string[]
  addTag: (tag: string) => Promise<void>
  removeTag: (tag: string) => Promise<void>
  updateTag: (oldTag: string, newTag: string) => Promise<void>

  // App metadata
  appMeta: AppMetadata | null
  finishOnboarding: () => Promise<void>
  dismissOnboarding: () => Promise<void>
  checkFirstRun: () => Promise<boolean>
  recordFirstRun: () => Promise<void>

  // Refresh
  refresh: () => Promise<void>
}

export function useMetadata(): UseMetadataReturn {
  const [metadata, setMetadata] = useState<MetadataStore | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await readMetadata()
      setMetadata(data)
    } catch (err) {
      console.error('[useMetadata] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load metadata')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Host metadata helpers
  const getHostMeta = useCallback(
    (hostAlias: string): HostMetadata | null => {
      return metadata?.hosts[hostAlias] || null
    },
    [metadata]
  )

  const setHostMeta = useCallback(
    async (hostAlias: string, meta: Partial<HostMetadata>) => {
      await setHostMetadata(hostAlias, meta)
      await refresh()
    },
    [refresh]
  )

  const addTags = useCallback(
    async (hostAlias: string, tags: string[]) => {
      await addHostTags(hostAlias, tags)
      await refresh()
    },
    [refresh]
  )

  const removeTags = useCallback(
    async (hostAlias: string, tags: string[]) => {
      await removeHostTags(hostAlias, tags)
      await refresh()
    },
    [refresh]
  )

  const toggleFavoriteWrapper = useCallback(
    async (hostAlias: string): Promise<boolean> => {
      const result = await toggleHostFavorite(hostAlias)
      await refresh()
      return result
    },
    [refresh]
  )

  const markUsed = useCallback(
    async (hostAlias: string) => {
      await updateLastUsed(hostAlias)
      await refresh()
    },
    [refresh]
  )

  const deleteHostMeta = useCallback(
    async (hostAlias: string) => {
      await deleteHostMetadata(hostAlias)
      await refresh()
    },
    [refresh]
  )

  const renameHostMeta = useCallback(
    async (oldAlias: string, newAlias: string) => {
      await renameHostMetadata(oldAlias, newAlias)
      await refresh()
    },
    [refresh]
  )

  // Tag helpers
  const addTag = useCallback(
    async (tag: string) => {
      await createTag(tag)
      await refresh()
    },
    [refresh]
  )

  const removeTag = useCallback(
    async (tag: string) => {
      await deleteTag(tag)
      await refresh()
    },
    [refresh]
  )

  const updateTag = useCallback(
    async (oldTag: string, newTag: string) => {
      await renameTag(oldTag, newTag)
      await refresh()
    },
    [refresh]
  )

  // App metadata helpers
  const finishOnboarding = useCallback(async () => {
    await completeOnboarding()
    await refresh()
  }, [refresh])

  const dismissOnboarding = useCallback(async () => {
    await skipOnboarding()
    await refresh()
  }, [refresh])

  const checkFirstRun = useCallback(async (): Promise<boolean> => {
    return await isFirstRun()
  }, [])

  const recordFirstRun = useCallback(async () => {
    await markFirstRun()
    await refresh()
  }, [refresh])

  return {
    metadata,
    loading,
    error,

    getHostMeta,
    setHostMeta,
    addTags,
    removeTags,
    toggleFavorite: toggleFavoriteWrapper,
    markUsed,
    deleteHostMeta,
    renameHostMeta,

    allTags: metadata?.tags || [],
    addTag,
    removeTag,
    updateTag,

    appMeta: metadata?.app || null,
    finishOnboarding,
    dismissOnboarding,
    checkFirstRun,
    recordFirstRun,

    refresh,
  }
}
