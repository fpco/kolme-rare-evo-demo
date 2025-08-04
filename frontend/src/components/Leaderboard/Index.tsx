import type { FormattedLeaderboardEntry } from '../../api/gameApi'
import Card from '../Card/Index'

interface LeaderboardProps {
  data: FormattedLeaderboardEntry[]
}

const Leaderboard = ({ data }: LeaderboardProps) => {
  return (
    <Card
      id="leaderboard"
      className="w-full md:w-1/3 bg-gray-800/30 rounded-xl flex flex-col h-full"
    >
      <h3 className="text-2xl font-bold text-white mb-4">Leaderboard</h3>

      <div className="flex-1 md:min-h-[600px] flex flex-col">
        {data.length === 0 ? (
          <div className="text-center py-8 flex-1 flex flex-col justify-center">
            <div className="text-6xl mb-4">🏆</div>
            <h4 className="text-xl font-semibold text-gray-300 mb-2">
              No Players Yet
            </h4>
            <p className="text-gray-400 text-sm">
              Be the first to join the game and claim your spot on the
              leaderboard!
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
            {data.map((entry, index) => (
              <div
                key={entry.rank}
                className="flex w-full flex-col xl:flex-row items-center justify-between p-3 rounded-xl hover:bg-gray-800/30 transition-all"
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
                      <span className="text-white font-medium">
                        {entry.username}
                      </span>
                    </div>
                    <div className="text-right flex items-baseline gap-1">
                      <div className="text-fpblock font-bold">
                        {entry.points.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">points</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

export default Leaderboard
