export type SoundPackCategory = 'serious' | 'fun'

export interface SoundPack {
  id: string
  label: string
  description: string
  category: SoundPackCategory
}

export const DEFAULT_SOUND_PACK_ID = 'gym-buzzer'

export const SOUND_PACKS: SoundPack[] = [
  // Serious
  {
    id: 'gym-buzzer',
    label: 'Gym Buzzer',
    description: 'Real sports buzzer sample — the default.',
    category: 'serious',
  },
  {
    id: 'boxing-bell',
    label: 'Boxing Bell',
    description: 'Recorded ring bell hits.',
    category: 'serious',
  },
  {
    id: 'air-horn',
    label: 'Air Horn',
    description: 'Pneumatic air-horn blast.',
    category: 'serious',
  },
  {
    id: 'whistle',
    label: 'Referee Whistle',
    description: 'Classic plastic referee whistle.',
    category: 'serious',
  },
  {
    id: 'digital-beep',
    label: 'Digital Beep',
    description: 'Short electronic beeps.',
    category: 'serious',
  },
  // Fun
  {
    id: 'duck',
    label: 'Duck',
    description: 'Duck call samples.',
    category: 'fun',
  },
  {
    id: 'cat',
    label: 'Cat',
    description: 'Cat meow samples.',
    category: 'fun',
  },
  {
    id: 'dog',
    label: 'Dog',
    description: 'Dog bark samples.',
    category: 'fun',
  },
  {
    id: 'chicken',
    label: 'Chicken',
    description: 'Chicken / poultry samples.',
    category: 'fun',
  },
  {
    id: 'fart',
    label: 'Fart',
    description: 'Yes, really.',
    category: 'fun',
  },
  {
    id: 'boing',
    label: 'Cartoon Boing',
    description: 'Springy cartoon boing.',
    category: 'fun',
  },
  {
    id: 'laser',
    label: 'Laser Pew',
    description: 'Sci-fi sonar / blip energy.',
    category: 'fun',
  },
  {
    id: 'trombone',
    label: 'Fail Horn',
    description: 'Game-show fail buzz energy.',
    category: 'fun',
  },
]

export function isSoundPackId(value: unknown): value is string {
  return typeof value === 'string' && SOUND_PACKS.some((pack) => pack.id === value)
}

export function getSoundPack(id: string | null | undefined): SoundPack {
  return SOUND_PACKS.find((pack) => pack.id === id) ?? SOUND_PACKS[0]!
}
