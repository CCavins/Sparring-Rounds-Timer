import { onUnmounted, ref } from 'vue'

export function useFullscreen(target?: () => HTMLElement | null) {
  const supported = ref(
    typeof document !== 'undefined' &&
      !!(
        document.fullscreenEnabled ||
        (document as Document & { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled
      ),
  )
  const isFullscreen = ref(false)

  function getElement(): HTMLElement {
    return target?.() ?? document.documentElement
  }

  function sync(): void {
    const doc = document as Document & { webkitFullscreenElement?: Element | null }
    isFullscreen.value = !!(document.fullscreenElement || doc.webkitFullscreenElement)
  }

  async function enter(): Promise<void> {
    const el = getElement() as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void> | void
    }
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen()
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen()
      }
    } catch {
      // User denied or unsupported
    } finally {
      sync()
    }
  }

  async function exit(): Promise<void> {
    const doc = document as Document & {
      webkitExitFullscreen?: () => Promise<void> | void
    }
    try {
      if (document.exitFullscreen && document.fullscreenElement) {
        await document.exitFullscreen()
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen()
      }
    } catch {
      // ignore
    } finally {
      sync()
    }
  }

  async function toggle(): Promise<void> {
    if (isFullscreen.value) {
      await exit()
    } else {
      await enter()
    }
  }

  function onChange(): void {
    sync()
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
  }

  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  })

  return {
    supported,
    isFullscreen,
    enter,
    exit,
    toggle,
  }
}
