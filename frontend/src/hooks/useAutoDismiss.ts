import { useEffect } from 'react';

// Hook to automatically reset mutation state after a delay
export const useAutoDismiss = (mutation: any, delay: number = 3000) => {
  useEffect(() => {
    if (mutation.isSuccess || mutation.isError) {
      const timer = setTimeout(() => {
        mutation.reset();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [mutation.isSuccess, mutation.isError, mutation.reset, delay]);
};
