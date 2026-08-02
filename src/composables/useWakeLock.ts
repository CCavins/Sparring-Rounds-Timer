import { onUnmounted, ref } from 'vue'

export function useWakeLock() {
  const supported = ref(
    typeof navigator !== 'undefined' && 'wakeLock' in navigator,
  )
  const active = ref(false)
  let sentinel: WakeLockSentinel | null = null

  async function request(): Promise<void> {
    if (!supported.value) return
    try {
      sentinel = await navigator.wakeLock.request('screen')
      active.value = true
      sentinel.addEventListener('release', () => {
        active.value = false
      })
    } catch {
      active.value = false
      sentinel = null
    }
  }

  async function release(): Promise<void> {
    if (!sentinel) return
    try {
      await sentinel.release()
    } catch {
      // ignore
    } finally {
      sentinel = null
      active.value = false
    }
  }

  async function onVisibilityChange(): Promise<void> {
    if (document.visibilityState === 'visible' && active.value === false && sentinel === null) {
      // Caller re-requests when workout is running
    }
  }

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  onUnmounted(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
    void release()
  })

  return {
    supported,
    active,
    request,
    release,
  }
}
