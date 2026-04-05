export interface AvatarPreset {
  id: string
  emoji: string
  bg: string       // Tailwind bg class
  color: string    // Tailwind text class
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'preset_0', emoji: '🏀', bg: 'bg-orange-500', color: 'text-white' },
  { id: 'preset_1', emoji: '🔥', bg: 'bg-red-500',    color: 'text-white' },
  { id: 'preset_2', emoji: '⚡', bg: 'bg-yellow-400', color: 'text-gray-900' },
  { id: 'preset_3', emoji: '🦁', bg: 'bg-amber-600',  color: 'text-white' },
  { id: 'preset_4', emoji: '🐉', bg: 'bg-purple-600', color: 'text-white' },
  { id: 'preset_5', emoji: '🌙', bg: 'bg-blue-600',   color: 'text-white' },
]

export function getPreset(avatarUrl: string | null | undefined): AvatarPreset | null {
  if (!avatarUrl?.startsWith('preset_')) return null
  return AVATAR_PRESETS.find((p) => p.id === avatarUrl) ?? null
}
