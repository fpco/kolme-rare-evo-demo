import { useUserFunds } from '../../hooks/useUserFunds'
import Card from '../Card/Index'

const BetHistory = () => {
  const { data: userFunds } = useUserFunds()

  const betHistory = userFunds?.betHistory || {}
  const sortedDates = Object.keys(betHistory).sort().reverse()
  const hasClaimed = userFunds?.claimed || false

  // this is to avoid a render if the user hasn't claimed funds yet
  // because if we fetch instantly, it will return an empty bet history
  if (!hasClaimed) {
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getTotalBetsForRound = (bets: Record<string, string>) => {
    return Object.values(bets).reduce((total, amount) => total + Number(amount), 0)
  }

  const hasBets = sortedDates.length > 0

  return (
    <Card className="w-full bg-gray-800/30 rounded-xl mt-4">
      <div className="p-4">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <span className="mr-2">🎲</span>
          Your Bet History
        </h3>
        
        {!hasBets ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-gray-400 text-sm">
              No bets placed yet. Place your first bet to see your history here!
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-h-[300px] overflow-auto md:max-h-none">
            {sortedDates.map((dateString) => {
              const bets = betHistory[dateString]
              const totalAmount = getTotalBetsForRound(bets)
              
              return (
                <div
                  key={dateString}
                  className="border border-gray-700 rounded-lg p-3 bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-1">
                    <div className="text-sm text-gray-300 font-medium">
                      {formatDate(dateString)}
                    </div>
                    <div className="text-sm text-green-400 font-semibold">
                      Total: {totalAmount} funds
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {Object.entries(bets).map(([guess, amount]) => (
                      <div
                        key={guess}
                        className="flex justify-between items-center text-xs bg-gray-700/30 rounded px-2 py-1"
                      >
                        <span className="text-gray-300 font-medium">
                          Guess: <span className="text-fpblock font-bold">{guess}</span>
                        </span>
                        <span className="text-white font-mono">
                          {amount} funds
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}

export default BetHistory
