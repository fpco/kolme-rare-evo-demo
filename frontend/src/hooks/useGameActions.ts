import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { PlaceBetParams } from '../api/gameApi'
import { claimFunds, placeBet, setFundsClaimed } from '../client'
import { ACCOUNT_ID_QUERY_KEY, USER_FUNDS_QUERY_KEY } from './useUserFunds'

// Wrapper function that assumes success after timeout and updates localStorage accordingly
// This is because we dont receive a success response
const withTimeoutForClaimFunds = (
  fn: () => Promise<unknown>,
  timeoutMs = 2500,
) => {
  return async (): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      let completed = false

      const timeout = setTimeout(() => {
        if (!completed) {
          completed = true
          console.log('Claim funds assumed successful after timeout')
          setFundsClaimed()
          resolve({})
        }
      }, timeoutMs)

      fn()
        .then((result) => {
          if (!completed) {
            completed = true
            clearTimeout(timeout)
            resolve(result)
          }
        })
        .catch((error) => {
          if (!completed) {
            completed = true
            clearTimeout(timeout)
            reject(error)
          }
        })
    })
  }
}

const withTimeoutForPlaceBet = (
  fn: (params: PlaceBetParams) => Promise<unknown>,
  timeoutMs = 2500,
) => {
  return async (params: PlaceBetParams): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      let completed = false

      const timeout = setTimeout(() => {
        if (!completed) {
          completed = true
          console.log('Place bet assumed successful after timeout')
          resolve({})
        }
      }, timeoutMs)

      fn(params)
        .then((result) => {
          if (!completed) {
            completed = true
            clearTimeout(timeout)
            resolve(result)
          }
        })
        .catch((error) => {
          if (!completed) {
            completed = true
            clearTimeout(timeout)
            reject(error)
          }
        })
    })
  }
}

export const usePlaceBet = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: withTimeoutForPlaceBet((params: PlaceBetParams) =>
      placeBet(params.guess, params.amount),
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameData'] })
      queryClient.invalidateQueries({ queryKey: USER_FUNDS_QUERY_KEY })
    },
    onError: (error) => {
      console.error('Error placing bet:', error)
    },
  })
}

export const useClaimFunds = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: withTimeoutForClaimFunds(claimFunds),
    onSuccess: () => {
      // Invalidate and refetch game data after successful claim
      queryClient.invalidateQueries({ queryKey: ['gameData'] })
      queryClient.invalidateQueries({ queryKey: USER_FUNDS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ACCOUNT_ID_QUERY_KEY })
    },
    onError: (error) => {
      console.error('Error claiming funds:', error)
    },
  })
}
