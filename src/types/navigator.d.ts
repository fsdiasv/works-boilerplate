import type { BeforeInstallPromptEvent } from '@/lib/pwa'

export {}

declare global {
  interface Navigator {
    standalone?: boolean
    setAppBadge?: (count?: number) => Promise<void>
    clearAppBadge?: () => Promise<void>
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}
