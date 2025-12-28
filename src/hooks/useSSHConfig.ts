import { useState, useEffect, useCallback } from 'react'
import {
  readSSHConfig,
  addSSHHost,
  updateSSHHost,
  removeSSHHost,
} from '@/lib/ssh-service'
import type { ParsedSSHConfig, SSHHostConfig } from '@/lib/ssh-config'

interface UseSSHConfigReturn {
  config: ParsedSSHConfig | null
  hosts: SSHHostConfig[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  addHost: (host: SSHHostConfig) => Promise<void>
  updateHost: (oldName: string, host: SSHHostConfig) => Promise<void>
  deleteHost: (hostName: string) => Promise<void>
}

export function useSSHConfig(): UseSSHConfigReturn {
  const [config, setConfig] = useState<ParsedSSHConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('[useSSHConfig] Loading SSH config...')
      const parsed = await readSSHConfig()
      console.log('[useSSHConfig] Loaded:', parsed)
      setConfig(parsed)
    } catch (err) {
      console.error('[useSSHConfig] Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load SSH config')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const addHost = useCallback(
    async (host: SSHHostConfig) => {
      try {
        setError(null)
        await addSSHHost(host)
        await refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add host')
        throw err
      }
    },
    [refresh]
  )

  const updateHost = useCallback(
    async (oldName: string, host: SSHHostConfig) => {
      try {
        setError(null)
        await updateSSHHost(oldName, host)
        await refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update host')
        throw err
      }
    },
    [refresh]
  )

  const deleteHost = useCallback(
    async (hostName: string) => {
      try {
        setError(null)
        await removeSSHHost(hostName)
        await refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete host')
        throw err
      }
    },
    [refresh]
  )

  return {
    config,
    hosts: config?.hosts ?? [],
    loading,
    error,
    refresh,
    addHost,
    updateHost,
    deleteHost,
  }
}
