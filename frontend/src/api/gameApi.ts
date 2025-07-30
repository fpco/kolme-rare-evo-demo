// API service for fetching game data
const API_BASE_URL = 'http://nlb.prod.fpcomplete.com:3000/';

export interface GameData {
  current_round_finishes: string;
  current_bets: string;
  last_winner: LastWinner | null;
  leaderboard: LeaderboardEntry[];
}

export interface LastWinner {
  finished: string;
  number: number;
  winnings: Record<string, string>;
}

export interface LeaderboardEntry {
  account: string;
  winnings: string;
}

export interface FormattedLeaderboardEntry {
  rank: number;
  avatar: string;
  username: string;
  walletId: string;
  points: number;
}

export interface PlaceBetParams {
  guess: number;
  amount: number;
}

export const fetchGameData = async (): Promise<GameData> => {
  const response = await fetch(`${API_BASE_URL}/guess-game`);
  if (!response.ok) {
    throw new Error(`Failed to fetch game data: ${response.statusText}`);
  }
  return response.json();
};

export const formatLeaderboardData = (leaderboard: LeaderboardEntry[]): FormattedLeaderboardEntry[] => {
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    const pointsA = Math.round(parseFloat(a.winnings) * 100);
    const pointsB = Math.round(parseFloat(b.winnings) * 100);
    
    if (pointsB !== pointsA) {
      return pointsB - pointsA;
    }
    
    // If points are equal, sort by account numerically for stable ordering
    const accountA = parseInt(String(a.account)) || 0;
    const accountB = parseInt(String(b.account)) || 0;
    return accountA - accountB;
  });

  return sortedLeaderboard.map((entry, index) => ({
    rank: index + 1,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.account}`,
    username: `Player #${entry.account}`,
    walletId: entry.account,
    points: Math.round(parseFloat(entry.winnings) * 100), // Multiply by 100 for display
  }));
};

export const calculateCountdown = (finishTime: string): number => {
  const now = new Date().getTime();
  const finish = new Date(finishTime).getTime();
  const diff = Math.max(0, Math.ceil((finish - now) / 1000));
  return diff;
};

// Game actions that integrate with kolmeclient
export const placeBet = async (params: PlaceBetParams) => {
  const { placeBet: kolmePlaceBet } = await import('../kolmeclient');
  return kolmePlaceBet(params.guess, params.amount);
};

export const claimFunds = async () => {
  const { claimFunds: kolmeClaimFunds } = await import('../kolmeclient');
  return kolmeClaimFunds();
};
