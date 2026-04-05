import { getPreset } from '@/utils/avatar'

interface AvatarProps {
  avatarUrl: string | null | undefined
  displayName: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClass = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
}

const emojiSize = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
}

export function Avatar({ avatarUrl, displayName, size = 'sm' }: AvatarProps) {
  const preset = getPreset(avatarUrl)
  const base = `${sizeClass[size]} rounded-full flex items-center justify-center font-bold shrink-0`

  if (preset) {
    return (
      <div className={`${base} ${preset.bg}`}>
        <span className={emojiSize[size]}>{preset.emoji}</span>
      </div>
    )
  }

  return (
    <div className={`${base} bg-blue-100 text-blue-600`}>
      {displayName.charAt(0).toUpperCase()}
    </div>
  )
}
