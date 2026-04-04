import Image from 'next/image'
import { getTeamLogoUrl, getTeamShortName } from '@/utils/nba-teams'

interface TeamDisplayProps {
  teamName: string
  score: number | null
  isWinner: boolean
  size?: 'sm' | 'lg'
}

export function TeamDisplay({ teamName, score, isWinner, size = 'sm' }: TeamDisplayProps) {
  const logoUrl = getTeamLogoUrl(teamName)
  const shortName = getTeamShortName(teamName)
  const logoSize = size === 'lg' ? 64 : 40
  const hasScore = score !== null

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* ロゴ */}
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={teamName}
          width={logoSize}
          height={logoSize}
          className={`object-contain ${!isWinner && hasScore ? 'opacity-40' : ''}`}
        />
      ) : (
        <div
          className={`rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold ${
            size === 'lg' ? 'w-16 h-16 text-lg' : 'w-10 h-10 text-sm'
          }`}
        >
          {shortName.charAt(0)}
        </div>
      )}

      {/* チーム名 */}
      <p className={`font-semibold leading-tight text-center ${
        size === 'lg' ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'
      } ${!isWinner && hasScore ? 'text-gray-400' : 'text-gray-800'}`}>
        {shortName}
      </p>

      {/* スコア */}
      {hasScore && (
        <p className={`font-bold leading-none ${
          size === 'lg' ? 'text-5xl sm:text-6xl' : 'text-2xl sm:text-3xl'
        } ${isWinner ? 'text-gray-900' : 'text-gray-300'}`}>
          {score}
        </p>
      )}
    </div>
  )
}
