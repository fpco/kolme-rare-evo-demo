import Card from '../Card/Index'

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
  return (
    <div className="flex max-w-full gap-4 min-h-2/3">
      <Card id="leaderboard" className="w-1/3 bg-black/30 p-4 rounded-xl">
        <h3 className="text-2xl font-bold text-white mb-4">Leaderboard</h3>
        {mockLeaderboardData.map((entry, index) => (
          <div
            key={entry.rank}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-black/30 transition-all animate-pulse-scale"
            style={{
              animationDelay: `${8 + index * 150}ms`,
              animationDuration: '10s',
              animationIterationCount: 'infinite',
            }}
          >
            <div className="flex items-center">
              <div className="text-lg font-bold text-gray-300 w-6">
                {entry.rank}
              </div>
              <img
                src={entry.avatar}
                alt={entry.username}
                className="w-10 h-10 rounded-full mr-2"
              />
              <div className="flex flex-col">
                <span className="text-white font-medium">{entry.username}</span>
                <span className="text-xs text-gray-400 truncate max-w-32">
                  {entry.walletId}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-orange-400 font-bold">
                {entry.points.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400">points</div>
            </div>
          </div>
        ))}
      </Card>
      <Card
        id="mainContent"
        className="w-2/3 flex flex-col gap-4 bg-black/30 p-4 rounded-xl"
      >
        <h1 className="text-6xl font-bold">Number_Generated</h1>
        <div>text input</div>
      </Card>
    </div>
  )
}

export default Content
