import { useQuery } from '@tanstack/react-query'

import { getUserFunds, hasClaimedFunds, publicKey } from '../client'

export const USER_FUNDS_QUERY_KEY = ['userFunds'] as const

export const useUserFunds = () => {
  return useQuery({
    queryKey: USER_FUNDS_QUERY_KEY,
    queryFn: () => {
      const funds = getUserFunds()
      const claimed = hasClaimedFunds()

      return {
        funds,
        claimed,
        publicKey,
      }
    },
  })
}
