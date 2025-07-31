import { useQuery } from '@tanstack/react-query'

import { getCurrentUser, getUserFunds, hasClaimedFunds } from '../kolmeclient'

export const USER_FUNDS_QUERY_KEY = ['userFunds'] as const

// Hook to get user funds data
export const useUserFunds = () => {
  return useQuery({
    queryKey: USER_FUNDS_QUERY_KEY,
    queryFn: () => {
      const currentUser = getCurrentUser()
      const funds = getUserFunds()
      const claimed = hasClaimedFunds()

      return {
        funds,
        claimed,
        userKey: currentUser.userKey,
        publicKey: currentUser.publicKey,
        shortAddress: currentUser.shortAddress,
      }
    },
    staleTime: 0, // Always refetch when accessed
    gcTime: 0, // Don't cache in background
  })
}
