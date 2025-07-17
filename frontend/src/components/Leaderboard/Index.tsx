import { useState } from 'react'

import Card from '../Card/Index'

interface LeaderboardEntry {
  rank: number
  avatar: string
  username: string
  walletId: string
  points: number
}

interface LeaderboardProps {
  data: LeaderboardEntry[]
}

const Leaderboard = ({ data }: LeaderboardProps) => {
  const [copiedWalletId, setCopiedWalletId] = useState<string | null>(null)

  const handleCopyWalletId = async (walletId: string) => {
    try {
      await navigator.clipboard.writeText(walletId)
      setCopiedWalletId(walletId)
      setTimeout(() => setCopiedWalletId(null), 2000)
    } catch (err) {
      console.error('Failed to copy wallet ID:', err)
    }
  }

  return (
    <Card id="leaderboard" className="w-full md:w-1/3 bg-black/30 rounded-xl">
      <h3 className="text-2xl font-bold text-white mb-4">Leaderboard</h3>
      {data.map((entry, index) => (
        <div
          key={entry.rank}
          className="flex w-full flex-col xl:flex-row items-center justify-between p-3 rounded-xl hover:bg-black/30 transition-all animate-pulse-scale"
          style={{
            animationDelay: `${20 + index * 150}ms`,
            animationDuration: '10s',
            animationIterationCount: 'infinite',
          }}
        >
          <div className="flex items-center w-full">
            <div className="text-lg font-bold text-gray-300 w-6">
              {entry.rank}
            </div>
            <img
              src={entry.avatar}
              alt={entry.username}
              className="w-10 h-10 rounded-full mr-2"
            />
            <div className="w-full flex flex-row flex-wrap justify-between">
              <div className="flex flex-col">
                <span className="text-white font-medium">{entry.username}</span>
                <button
                  type="button"
                  className={`text-xs md:truncate max-w-32 text-left truncate transition-colors cursor-pointer ${
                    copiedWalletId === entry.walletId
                      ? 'text-green-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => handleCopyWalletId(entry.walletId)}
                  title="Click to copy wallet ID"
                >
                  {copiedWalletId === entry.walletId
                    ? 'Copied!'
                    : entry.walletId}
                </button>
              </div>
              <div className="text-right flex items-baseline gap-1">
                <div className="text-[#FF9409] font-bold">
                  {entry.points.toLocaleString()}
                </div>
                <div className="text-xs text-gray-400">points</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </Card>
  )
}

export default Leaderboard
