import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import Card from '../Card/Index'
import Leaderboard from '../Leaderboard/Index'
import { fetchGameData, formatLeaderboardData, calculateCountdown, type GameData } from '../../api/gameApi'

const Content = () => {
  const [countdown, setCountdown] = useState(0)
  const [userGuess, setUserGuess] = useState('')
  const [animatedNumber, setAnimatedNumber] = useState(0)

  const { data: gameData, isLoading, isFetching, error, refetch } = useQuery<GameData>({
    queryKey: ['gameData'],
    queryFn: fetchGameData,
    staleTime: 0,
  })

  useEffect(() => {
    if (gameData?.current_round_finishes) {
      const newCountdown = calculateCountdown(gameData.current_round_finishes)
      setCountdown(newCountdown)
    }
  }, [gameData])

  // refetch 1 second after round finishes
  useEffect(() => {
    if (gameData?.current_round_finishes) {
      const finishTime = new Date(gameData.current_round_finishes).getTime()
      const now = Date.now()
      const timeUntilRefetch = finishTime - now + 5000 // one second after finish

      if (timeUntilRefetch > 0) {
        const timeout = setTimeout(() => {
          refetch()
        }, timeUntilRefetch)

        return () => clearTimeout(timeout)
      }
    }
  }, [gameData?.current_round_finishes])

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null

    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1))
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [countdown])

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedNumber(Math.floor(Math.random() * 256))
    }, 25) 

    return () => {
      clearInterval(interval)
    }
  }, [])

  const formattedLeaderboard = gameData?.leaderboard ? formatLeaderboardData(gameData.leaderboard) : []

  if (isLoading) {
    return (
      <div className="flex flex-col-reverse justify-center items-center md:flex-row max-w-full gap-4 min-h-2/3">
        <Card id="leaderboard" className="w-full md:w-1/3 bg-black/30 rounded-xl">
          <div className="text-center text-white p-8">Loading leaderboard...</div>
        </Card>
        <Card id="mainContent" className="w-2/3 flex flex-col gap-4 p-4 rounded-xl">
          <div className="w-full h-full items-center justify-center flex flex-col gap-4">
            <div className="text-4xl font-bold text-fpblock mb-4">Loading...</div>
            <h1 className="text-[220px] font-bold font-montserrat">---</h1>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col-reverse justify-center items-center md:flex-row max-w-full gap-4 min-h-2/3">
        <Card id="leaderboard" className="w-full md:w-1/3 bg-black/30 rounded-xl">
          <div className="text-center text-red-400 p-8">
            <h3 className="text-xl font-bold mb-2">Connection Error</h3>
            <p>Unable to load leaderboard data</p>
            <button 
              onClick={() => refetch()} 
              className="mt-4 px-4 py-2 bg-fpblock rounded-lg hover:bg-fpblock/80 transition-colors"
            >
              Retry
            </button>
          </div>
        </Card>
        <Card id="mainContent" className="w-2/3 flex flex-col gap-4 p-4 rounded-xl">
          <div className="w-full h-full items-center justify-center flex flex-col gap-4">
            <div className="text-4xl font-bold text-red-400 mb-4">Connection Error</div>
            <h1 className="text-[100px] font-bold font-montserrat text-red-400">ERROR</h1>
            <p className="text-white text-center">Unable to connect to game server</p>
            <button 
              onClick={() => refetch()} 
              className="mt-4 px-6 py-3 bg-fpblock rounded-lg hover:bg-fpblock/80 transition-colors text-white font-medium"
            >
              Retry Connection
            </button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col-reverse justify-center items-center md:flex-row max-w-full gap-4 min-h-2/3">
      <Leaderboard data={formattedLeaderboard} />
      <Card
        id="mainContent"
        className="w-2/3 flex flex-col gap-4 p-4 rounded-xl"
      >
        <div className="w-full h-full items-center justify-center flex flex-col gap-4">
          <div className="text-4xl font-bold text-fpblock mb-4">
            {countdown > 0 ? (
              <>
                <span className="text-white">Next Round in: </span>
                <span className="text-fpblock">{countdown}s</span>
              </>
            ) : (
              <span className="text-green-400">🎲 Round Finished!</span>
            )}
          </div>
          
          <div className="text-center">
            {gameData?.last_winner && !isFetching ? (
              <>
                <h1 className="text-[120px] font-bold font-montserrat text-fpblock">
                  {gameData.last_winner.number}
                </h1>
                <p className="text-lg text-gray-300 mb-2">Last Winning Number</p>
              </>
            ) : (
              <>
                <h1 className="text-[120px] font-bold font-montserrat text-fpblock">
                  {animatedNumber.toString().padStart(3, '0')}
                </h1>
                <p className="text-lg text-gray-300 mb-2">Generating Numbers...</p>
              </>
            )}
          </div>

          <div className="w-full max-w-xs">
            <input
              type="number"
              min="0"
              placeholder={countdown === 0 ? "Betting closed" : "Enter your guess"}
              value={userGuess}
              onChange={(e) => {
                const value = e.target.value
                if (value === '' || (Number(value) >= 0 && Number(value) <= 255)) {
                  setUserGuess(value)
                }
              }}
              className="w-full ring-1 ring-fpblock rounded-lg bg-black/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-3 text-center text-white placeholder-gray-400"
              disabled={countdown === 0}
            />
          </div>
          <div className="text-center text-xs text-gray-300 space-y-1">
            <p>Round finishes: {gameData?.current_round_finishes ? new Date(gameData.current_round_finishes).toLocaleTimeString() : 'Loading...'}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Content
