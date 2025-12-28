import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'ssh-buddy-dismissed-tips'

interface TipsContextValue {
  dismissedTips: Set<string>
  shouldShowTip: (tipId: string) => boolean
  dismissTip: (tipId: string) => void
  resetAllTips: () => void
}

const TipsContext = createContext<TipsContextValue | null>(null)

function loadDismissedTips(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        return new Set(parsed)
      }
    }
  } catch (e) {
    console.warn('Failed to load dismissed tips from localStorage:', e)
  }
  return new Set()
}

function saveDismissedTips(tips: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...tips]))
  } catch (e) {
    console.warn('Failed to save dismissed tips to localStorage:', e)
  }
}

export function TipsProvider({ children }: { children: ReactNode }) {
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(() =>
    loadDismissedTips()
  )

  // Sync to localStorage when dismissedTips changes
  useEffect(() => {
    saveDismissedTips(dismissedTips)
  }, [dismissedTips])

  const shouldShowTip = useCallback(
    (tipId: string) => {
      return !dismissedTips.has(tipId)
    },
    [dismissedTips]
  )

  const dismissTip = useCallback((tipId: string) => {
    setDismissedTips((prev) => {
      const next = new Set(prev)
      next.add(tipId)
      return next
    })
  }, [])

  const resetAllTips = useCallback(() => {
    setDismissedTips(new Set())
  }, [])

  return (
    <TipsContext.Provider
      value={{
        dismissedTips,
        shouldShowTip,
        dismissTip,
        resetAllTips,
      }}
    >
      {children}
    </TipsContext.Provider>
  )
}

export function useTips(): TipsContextValue {
  const context = useContext(TipsContext)
  if (!context) {
    throw new Error('useTips must be used within a TipsProvider')
  }
  return context
}
