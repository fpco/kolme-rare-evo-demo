import { useMutation, useQueryClient } from '@tanstack/react-query';
import { placeBet, claimFunds, type PlaceBetParams } from '../api/gameApi';

// Hook for placing bets
export const usePlaceBet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (params: PlaceBetParams) => placeBet(params),
    onSuccess: () => {
      // Invalidate and refetch game data after successful bet
      queryClient.invalidateQueries({ queryKey: ['gameData'] });
    },
    onError: (error) => {
      console.error('Error placing bet:', error);
    },
  });
};

// Hook for claiming funds
export const useClaimFunds = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: claimFunds,
    onSuccess: () => {
      // Invalidate and refetch game data after successful claim
      queryClient.invalidateQueries({ queryKey: ['gameData'] });
    },
    onError: (error) => {
      console.error('Error claiming funds:', error);
    },
  });
};
