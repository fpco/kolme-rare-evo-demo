// API service for fetching game data
export const API_BASE_URL = 'https://game.prod.fpcomplete.com'

export interface GameData {
  current_round_finishes: string
  current_bets: string
  last_winner: LastWinner | null
  leaderboard: LeaderboardEntry[]
}

export interface LastWinner {
  finished: string
  number: number
  winnings: Record<string, string>
}

export interface LeaderboardEntry {
  account: number
  winnings: string
}

export interface FormattedLeaderboardEntry {
  rank: number
  avatar: string
  username: string
  account: number
  points: number
}

export interface PlaceBetParams {
  guess: number
  amount: number
}

export interface UserFundsData {
  funds: number
  bet_history: Record<string, Record<string, string>>
}

export interface AccountIdData {
  found: {
    account_id: number
  }
}

export const fetchGameData = async (): Promise<GameData> => {
  const response = await fetch(`${API_BASE_URL}/guess-game`)
  if (!response.ok) {
    throw new Error(`Failed to fetch game data: ${response.statusText}`)
  }
  return response.json()
}

export const fetchUserFunds = async (publicKey: string): Promise<UserFundsData> => {
  const response = await fetch(`${API_BASE_URL}/guess-game/${publicKey}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch user funds: ${response.statusText}`)
  }
  return response.json()
}

export const fetchAccountId = async (publicKey: string): Promise<AccountIdData> => {
  const response = await fetch(`${API_BASE_URL}/account-id/pubkey/${publicKey}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch account ID: ${response.statusText}`)
  }
  return response.json()
}

export const formatLeaderboardData = (
  leaderboard: LeaderboardEntry[],
): FormattedLeaderboardEntry[] => {
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    const pointsA = Math.round(Number.parseFloat(a.winnings) * 100)
    const pointsB = Math.round(Number.parseFloat(b.winnings) * 100)

    if (pointsB !== pointsA) {
      return pointsB - pointsA
    }

    // If points are equal, sort by account numerically for stable ordering
    return a.account - b.account
  })

  return sortedLeaderboard.map((entry, index) => ({
    rank: index + 1,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.account}`,
    username: `Player #${entry.account}`,
    account: entry.account,
    points: Math.round(Number.parseFloat(entry.winnings) * 100), // Multiply by 100 for display
  }))
}

export const calculateCountdown = (finishTime: string): number => {
  const now = Date.now()
  const finish = new Date(finishTime).getTime()
  const diff = Math.max(0, Math.ceil((finish - now) / 1000))
  return diff
}
