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
    description: 'Harsh fight-timer buzz — the default.',
    category: 'serious',
  },
  {
    id: 'boxing-bell',
    label: 'Boxing Bell',
    description: 'Classic ring bell tones.',
    category: 'serious',
  },
  {
    id: 'air-horn',
    label: 'Air Horn',
    description: 'Loud blast to start and stop rounds.',
    category: 'serious',
  },
  {
    id: 'whistle',
    label: 'Referee Whistle',
    description: 'Sharp whistle cues.',
    category: 'serious',
  },
  {
    id: 'digital-beep',
    label: 'Digital Beep',
    description: 'Clean electronic timer tones.',
    category: 'serious',
  },
  // Fun
  {
    id: 'duck',
    label: 'Duck',
    description: 'Quacks when rounds change.',
    category: 'fun',
  },
  {
    id: 'cat',
    label: 'Cat',
    description: 'Meows and yowls for cues.',
    category: 'fun',
  },
  {
    id: 'dog',
    label: 'Dog',
    description: 'Barks at round transitions.',
    category: 'fun',
  },
  {
    id: 'chicken',
    label: 'Chicken',
    description: 'Clucks and a big squawk.',
    category: 'fun',
  },
  {
    id: 'fart',
    label: 'Fart',
    description: 'Mature humor for immature gyms.',
    category: 'fun',
  },
  {
    id: 'boing',
    label: 'Cartoon Boing',
    description: 'Springy slapstick sounds.',
    category: 'fun',
  },
  {
    id: 'laser',
    label: 'Laser Pew',
    description: 'Sci-fi blaster cues.',
    category: 'fun',
  },
  {
    id: 'trombone',
    label: 'Sad Trombone',
    description: 'Fail horn energy for rest & complete.',
    category: 'fun',
  },
]

export function isSoundPackId(value: unknown): value is string {
  return typeof value === 'string' && SOUND_PACKS.some((pack) => pack.id === value)
}

export function getSoundPack(id: string | null | undefined): SoundPack {
  return SOUND_PACKS.find((pack) => pack.id === id) ?? SOUND_PACKS[0]!
}
