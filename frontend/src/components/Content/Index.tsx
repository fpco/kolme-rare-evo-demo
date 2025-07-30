import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import Card from '../Card/Index'
import Leaderboard from '../Leaderboard/Index'
import { fetchGameData, formatLeaderboardData, calculateCountdown, type GameData } from '../../api/gameApi'
import { usePlaceBet } from '../../hooks/useGameActions'
import { useAutoDismiss } from '../../hooks/useAutoDismiss'
import { getUserFunds, hasSufficientFunds } from '../../kolmeclient'

const Content = () => {
  const [countdown, setCountdown] = useState(0)
  const [userGuess, setUserGuess] = useState('')
  const [animatedNumber, setAnimatedNumber] = useState(0)
  const [betAmount, setBetAmount] = useState('1')
  const [, setRefresh] = useState(0)

  const placeBetMutation = usePlaceBet()
  
  useAutoDismiss(placeBetMutation, 4000)

  // Listen for funds updates to refresh the component
  useEffect(() => {
    const handleFundsUpdate = () => {
      setRefresh(prev => prev + 1)
    }

    window.addEventListener('fundsUpdated', handleFundsUpdate)
    return () => window.removeEventListener('fundsUpdated', handleFundsUpdate)
  }, [])

  const { data: gameData, isLoading, isFetching, error, refetch } = useQuery<GameData>({
    queryKey: ['gameData'],
    queryFn: fetchGameData,
    staleTime: 0,
  })

  // Update funds display when gameData changes (might indicate funds were updated)
  useEffect(() => {
    // Force re-render to update funds display
  }, [gameData])

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

  const handlePlaceBet = async () => {
    const guess = Number(userGuess)
    const amount = Number(betAmount)
    
    if (guess >= 0 && guess <= 255 && amount > 0) {
      if (!hasSufficientFunds(amount)) {
        alert(`Insufficient funds! You have ${getUserFunds()} funds but need ${amount}`)
        return
      }
      
      try {
        await placeBetMutation.mutateAsync({ guess, amount })
        setUserGuess('') // Clear input after successful bet
      } catch (error) {
        // Error is handled in the hook
      }
    }
  }

  const getPlaceBetButtonText = () => {
    if (placeBetMutation.isPending) {
      return 'Processing...';
    }
    if (placeBetMutation.isSuccess) {
      return 'Bet Placed!';
    }
    if (placeBetMutation.isError) {
      return 'Failed - Retry';
    }
    if (betAmount && !hasSufficientFunds(Number(betAmount))) {
      return `Insufficient Funds (Need ${Number(betAmount)})`;
    }
    return 'Place Bet';
  };

  const getPlaceBetButtonClassName = () => {
    const baseClasses = "w-full font-semibold py-2 px-4 rounded-lg transition-colors duration-200";
    
    if (placeBetMutation.isPending) {
      return `${baseClasses} bg-yellow-600 text-white cursor-not-allowed`;
    }
    if (placeBetMutation.isSuccess) {
      return `${baseClasses} bg-green-600 text-white cursor-default`;
    }
    if (placeBetMutation.isError) {
      return `${baseClasses} bg-red-600 hover:bg-red-500 text-white cursor-pointer`;
    }
    return `${baseClasses} bg-fpblock hover:bg-fpblock/80 disabled:bg-gray-600 text-white`;
  };

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

          <div className="w-full max-w-xs space-y-4">
            <input
              type="number"
              min="0"
              max="255"
              placeholder={countdown === 0 ? "Betting closed" : "Enter your guess (0-255)"}
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
            
            <div className="flex flex-row sm:items-center gap-2">
              <label className="text-sm text-gray-300 sm:shrink-0">Bet Amount:</label>
              <input
                type="number"
                min="0"
                placeholder="Enter amount"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full sm:flex-1 ring-1 ring-fpblock rounded-lg bg-black/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-2 text-center text-white placeholder-gray-400"
                disabled={countdown === 0}
              />
            </div>
            
            <button
              onClick={handlePlaceBet}
              disabled={countdown === 0 || !userGuess || !betAmount || Number(betAmount) <= 0 || !hasSufficientFunds(Number(betAmount) || 0) || placeBetMutation.isPending || placeBetMutation.isSuccess}
              className={getPlaceBetButtonClassName()}
            >
              {getPlaceBetButtonText()}
            </button>
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
