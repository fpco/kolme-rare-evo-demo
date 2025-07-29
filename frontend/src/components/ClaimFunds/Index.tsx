import { useClaimFunds } from '../../hooks/useGameActions';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';

const ClaimFunds = () => {
  const claimFundsMutation = useClaimFunds();
  
  useAutoDismiss(claimFundsMutation, 4000);

  const handleClaimFunds = async () => {
    try {
      await claimFundsMutation.mutateAsync();
    } catch (error) {
    }
  };

  const getButtonText = () => {
    if (claimFundsMutation.isPending) {
      return 'Processing...';
    }
    if (claimFundsMutation.isSuccess) {
      return 'Claimed!';
    }
    if (claimFundsMutation.isError) {
      return 'Failed - Retry';
    }
    return 'Claim Funds';
  };

  const getButtonClassName = () => {
    const baseClasses = "font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm";
    
    if (claimFundsMutation.isPending) {
      return `${baseClasses} bg-yellow-600 text-white cursor-not-allowed`;
    }
    if (claimFundsMutation.isSuccess) {
      return `${baseClasses} bg-green-600 text-white cursor-default`;
    }
    if (claimFundsMutation.isError) {
      return `${baseClasses} bg-red-600 hover:bg-red-500 text-white cursor-pointer`;
    }
    return `${baseClasses} bg-fpblock hover:opacity-90 hover:cursor-pointer disabled:bg-gray-600 text-white`;
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        onClick={handleClaimFunds}
        disabled={claimFundsMutation.isPending || claimFundsMutation.isSuccess}
        className={getButtonClassName()}
      >
        {getButtonText()}
      </button>
    </div>
  );
};

export default ClaimFunds;
