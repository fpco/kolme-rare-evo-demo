import { useMutation, useQueryClient } from '@tanstack/react-query';
import { placeBet, claimFunds, type PlaceBetParams } from '../api/gameApi';

// Wrapper function that assumes success after 5 seconds if no error occurs
const withTimeout = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  timeoutMs: number = 2500
) => {
  return async (...args: T): Promise<R> => {
    return new Promise((resolve, reject) => {
      let completed = false;
      
      const timeout = setTimeout(() => {
        if (!completed) {
          completed = true;
          console.log('Transaction assumed successful after timeout');
          resolve({} as R); 
        }
      }, timeoutMs);
      
      
      fn(...args)
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
    mutationFn: withTimeout((params: PlaceBetParams) => placeBet(params)),
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
    mutationFn: withTimeout(() => claimFunds()),
    onSuccess: () => {
      // Invalidate and refetch game data after successful claim
      queryClient.invalidateQueries({ queryKey: ['gameData'] });
    },
    onError: (error) => {
      console.error('Error claiming funds:', error);
    },
  });
};
