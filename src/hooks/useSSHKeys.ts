import { useState, useEffect, useCallback } from 'react'
import {
  listSSHKeys,
  readPublicKey,
  deleteSSHKey,
  generateSSHKey,
  type SSHKeyInfo,
  type GenerateSSHKeyOptions,
} from '@/lib/ssh-service'

interface UseSSHKeysReturn {
  keys: SSHKeyInfo[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  getPublicKey: (keyName: string) => Promise<string>
  deleteKey: (keyName: string) => Promise<void>
  generateKey: (options: GenerateSSHKeyOptions) => Promise<void>
}

export function useSSHKeys(): UseSSHKeysReturn {
  const [keys, setKeys] = useState<SSHKeyInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('[useSSHKeys] Loading SSH keys...')
      const keyList = await listSSHKeys()
      console.log('[useSSHKeys] Loaded:', keyList)
      setKeys(keyList)
    } catch (err) {
      console.error('[useSSHKeys] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load SSH keys')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const getPublicKey = useCallback(async (keyName: string) => {
    try {
      return await readPublicKey(keyName)
    } catch (err) {
      throw new Error(
        err instanceof Error ? err.message : 'Failed to read public key'
      )
    }
  }, [])

  const deleteKey = useCallback(
    async (keyName: string) => {
      try {
        setError(null)
        await deleteSSHKey(keyName)
        await refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete key')
        throw err
      }
    },
    [refresh]
  )

  const generateKey = useCallback(
    async (options: GenerateSSHKeyOptions) => {
      try {
        setError(null)
        await generateSSHKey(options)
        await refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to generate key')
        throw err
      }
    },
    [refresh]
  )

  return {
    keys,
    loading,
    error,
    refresh,
    getPublicKey,
    deleteKey,
    generateKey,
  }
}
