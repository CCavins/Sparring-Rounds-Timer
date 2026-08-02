/** Format milliseconds as MM:SS (ceil so display hits 00:00 at transition). */
export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/** Format seconds as MM:SS for settings display. */
export function formatSeconds(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function parseDurationInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed)
  }

  const match = /^(\d{1,3}):([0-5]?\d)$/.exec(trimmed)
  if (!match) return null

  const minutes = Number(match[1])
  const seconds = Number(match[2])
  return minutes * 60 + seconds
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function progressRatio(
  remainingMilliseconds: number,
  phaseDurationMilliseconds: number,
): number {
  if (phaseDurationMilliseconds <= 0) return 1
  const elapsed = phaseDurationMilliseconds - remainingMilliseconds
  return clamp(elapsed / phaseDurationMilliseconds, 0, 1)
}
