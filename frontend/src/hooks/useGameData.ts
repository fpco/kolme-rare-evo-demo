import { useQuery } from '@tanstack/react-query'

import { fetchGameData } from '../api/gameApi'

export const GAME_DATA_QUERY_KEY = ['gameData'] as const

export const useGameData = () => {
  return useQuery({
    queryKey: GAME_DATA_QUERY_KEY,
    queryFn: () => fetchGameData(),
    staleTime: Number.POSITIVE_INFINITY,
  })
}
