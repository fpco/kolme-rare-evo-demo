import { useMutation, useQueryClient } from '@tanstack/react-query';
import { placeBet, claimFunds, type PlaceBetParams } from '../api/gameApi';
import { setFundsClaimed, subtractFunds } from '../kolmeclient';

// Wrapper function that assumes success after timeout and updates localStorage accordingly
const withTimeoutForClaimFunds = (
  fn: () => Promise<any>,
  timeoutMs: number = 2500
) => {
  return async (): Promise<any> => {
    return new Promise((resolve, reject) => {
      let completed = false;
      
      const timeout = setTimeout(() => {
        if (!completed) {
          completed = true;
          console.log('Claim funds assumed successful after timeout');
          // Update localStorage to mark funds as claimed
          setFundsClaimed();
          resolve({});
        }
      }, timeoutMs);
      
      fn()
        .then((result) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeout);
            resolve(result);
          }
        })
        .catch((error) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeout);
            reject(error);
          }
        });
    });
  };
};

const withTimeoutForPlaceBet = (
  fn: (params: PlaceBetParams) => Promise<any>,
  timeoutMs: number = 2500
) => {
  return async (params: PlaceBetParams): Promise<any> => {
    return new Promise((resolve, reject) => {
      let completed = false;
      
      const timeout = setTimeout(() => {
        if (!completed) {
          completed = true;
          console.log('Place bet assumed successful after timeout');
          // Update localStorage to subtract funds
          try {
            subtractFunds(params.amount);
            resolve({});
          } catch (error) {
            reject(error);
          }
        }
      }, timeoutMs);
      
      fn(params)
        .then((result) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeout);
            resolve(result);
          }
        })
        .catch((error) => {
          if (!completed) {
            completed = true;
            clearTimeout(timeout);
            reject(error);
          }
        });
    });
  };
};

export const usePlaceBet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: withTimeoutForPlaceBet((params: PlaceBetParams) => placeBet(params)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameData'] });
    },
    onError: (error) => {
      console.error('Error placing bet:', error);
    },
  });
};

export const useClaimFunds = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: withTimeoutForClaimFunds(() => claimFunds()),
    onSuccess: () => {
      // Invalidate and refetch game data after successful claim
      queryClient.invalidateQueries({ queryKey: ['gameData'] });
    },
    onError: (error) => {
      console.error('Error claiming funds:', error);
    },
  });
};
