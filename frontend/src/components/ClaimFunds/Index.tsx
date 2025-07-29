import { useClaimFunds } from '../../hooks/useGameActions';

const ClaimFunds = () => {
  const claimFundsMutation = useClaimFunds();

  const handleClaimFunds = async () => {
    try {
      await claimFundsMutation.mutateAsync();
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={handleClaimFunds}
        disabled={claimFundsMutation.isPending}
        className="bg-fpblock hover:opacity-90 hover:cursor-pointer disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
      >
        {claimFundsMutation.isPending ? 'Claiming...' : 'Claim Funds'}
      </button>
      {claimFundsMutation.isError && (
        <p className="text-xs text-red-400">
          Failed to claim funds. Please try again.
        </p>
      )}
      {claimFundsMutation.isSuccess && (
        <p className="text-xs text-green-400">
          Funds claimed successfully!
        </p>
      )}
    </div>
  );
};

export default ClaimFunds;
