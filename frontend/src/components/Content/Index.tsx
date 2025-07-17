import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import Card from '../Card/Index'
import Leaderboard from '../Leaderboard/Index'

const mockLeaderboardData = [
  {
    rank: 1,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CosmosExplorer',
    username: 'CosmosExplorer',
    walletId: 'osmo1k3x2v8h9w5n4m7q8r9s6t2u1v3w4x5y6z7a8b9c0',
    points: 45230,
  },
  {
    rank: 2,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OsmosisWhale',
    username: 'OsmosisWhale',
    walletId: 'osmo1m9n8o7p6q5r4s3t2u1v0w9x8y7z6a5b4c3d2e1f0',
    points: 38150,
  },
  {
    rank: 3,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StakingMaster',
    username: 'StakingMaster',
    walletId: 'osmo1b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3',
    points: 31890,
  },
  {
    rank: 4,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DeFiLegend',
    username: 'DeFiLegend',
    walletId: 'osmo1v4w5x6y7z8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o3',
    points: 28470,
  },
  {
    rank: 5,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TokenHunter',
    username: 'TokenHunter',
    walletId: 'osmo1p8q9r0s1t2u3v4w5x6y7z8a9b0c1d2e3f4g5h6i7',
    points: 24680,
  },
  {
    rank: 6,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ValidatorPro',
    username: 'ValidatorPro',
    walletId: 'osmo1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0c1',
    points: 21330,
  },
  {
    rank: 7,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LiquidityKing',
    username: 'LiquidityKing',
    walletId: 'osmo1d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5',
    points: 18920,
  },
  {
    rank: 8,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=YieldFarmer',
    username: 'YieldFarmer',
    walletId: 'osmo1x0y1z2a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9',
    points: 16540,
  },
  {
    rank: 9,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=BlockchainNinja',
    username: 'BlockchainNinja',
    walletId: 'osmo1r4s5t6u7v8w9x0y1z2a3b4c5d6e7f8g9h0i1j2k3',
    points: 14250,
  },
  {
    rank: 10,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CryptoPioneer',
    username: 'CryptoPioneer',
    walletId: 'osmo1l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2a3b4c5d6e7',
    points: 12180,
  },
]

const Content = () => {
  const [countdown, setCountdown] = useState(10)
  const [isActive, setIsActive] = useState(true)
  const [randomNumber, setRandomNumber] = useState(123)
  const [isGenerating, setIsGenerating] = useState(false)
  const [animationNumber, setAnimationNumber] = useState(123)

  const { refetch: generateNewNumber } = useQuery({
    queryKey: ['randomNumber'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return Math.floor(Math.random() * 900) + 100
    },
    enabled: false,
  })

  useEffect(() => {
    let animationInterval: number | null = null

    if (isGenerating) {
      animationInterval = setInterval(() => {
        setAnimationNumber(Math.floor(Math.random() * 900) + 100)
      }, 50)
    }

    return () => {
      if (animationInterval) clearInterval(animationInterval)
    }
  }, [isGenerating])

  useEffect(() => {
    let interval: number | null = null

    if (isActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    } else if (countdown === 0) {
      setIsActive(false)
      setIsGenerating(true)

      generateNewNumber().then((result) => {
        if (result.data) {
          setTimeout(() => {
            setRandomNumber(result.data)
            setAnimationNumber(result.data)
            setIsGenerating(false)
          }, 2000)
        }
      })

      setTimeout(() => {
        setCountdown(10)
        setIsActive(true)
      }, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, countdown, generateNewNumber])

  return (
    <div className="flex flex-col-reverse justify-center items-center md:flex-row max-w-full gap-4 min-h-2/3">
      <Leaderboard data={mockLeaderboardData} />
      <Card
        id="mainContent"
        className="w-2/3 flex flex-col gap-4 p-4 rounded-xl"
      >
        <div className="w-full h-full items-center justify-center flex flex-col gap-4">
          <div className="text-4xl font-bold text-[#FF9409] mb-4">
            {countdown === 0
              ? isGenerating
                ? 'Generating...'
                : "Time's up!"
              : `${countdown}s`}
          </div>
          <h1 className="text-[220px] font-bold font-montserrat">
            {isGenerating ? animationNumber : randomNumber}
          </h1>
          <h2
            style={{
              transition: 'color 0.3s ease',
              color: !isGenerating ? 'transparent' : 'inherit',
            }}
          >
            Last number was: {randomNumber}
          </h2>
          <input
            type="number"
            placeholder="Input your number"
            className="ring-1 ring-[#FF9409] rounded-lg bg-black/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none p-2 text-center"
          />
        </div>
      </Card>
    </div>
  )
}

export default Content
