import { useQuery } from '@tanstack/react-query'

import { fetchAccountId, fetchUserFunds } from '../api/gameApi'
import { hasClaimedFunds, publicKey } from '../client'

export const USER_FUNDS_QUERY_KEY = ['userFunds', publicKey] as const
export const ACCOUNT_ID_QUERY_KEY = ['accountId', publicKey] as const

export const useUserFunds = () => {
  return useQuery({
    queryKey: USER_FUNDS_QUERY_KEY,
    queryFn: async () => {
      const userFundsData = await fetchUserFunds(publicKey)
      const claimed = hasClaimedFunds()

      return {
        funds: userFundsData.funds,
        betHistory: userFundsData.bet_history,
        claimed,
        publicKey,
      }
    },
  })
}

export const useAccountId = () => {
  const { data: userFunds } = useUserFunds()
  const hasClaimed = userFunds?.claimed || false

  return useQuery({
    queryKey: ACCOUNT_ID_QUERY_KEY,
    queryFn: () => fetchAccountId(publicKey),
    enabled: hasClaimed,
  })
}
