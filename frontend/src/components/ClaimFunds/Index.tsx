import { useAutoDismiss } from '../../hooks/useAutoDismiss'
import { useClaimFunds } from '../../hooks/useGameActions'
import { useUserFunds } from '../../hooks/useUserFunds'

const ClaimFunds = () => {
  const claimFundsMutation = useClaimFunds()
  const { data: userFunds } = useUserFunds()

  useAutoDismiss(claimFundsMutation, 4000)

  const alreadyClaimed = userFunds?.claimed ?? false

  const handleClaimFunds = async () => {
    try {
      await claimFundsMutation.mutateAsync()
    } catch {}
  }

  const getButtonText = () => {
    if (claimFundsMutation.isPending) {
      return 'Claiming...'
    }
    if (claimFundsMutation.isSuccess) {
      return 'Claimed!'
    }
    if (claimFundsMutation.isError) {
      return 'Failed'
    }
    if (alreadyClaimed) {
      return 'Claimed'
    }
    return 'Claim Funds'
  }

  const getButtonClassName = () => {
    const baseClasses =
      'font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm'

    if (claimFundsMutation.isPending) {
      return `${baseClasses} bg-yellow-600 text-white cursor-not-allowed`
    }
    if (claimFundsMutation.isSuccess) {
      return `${baseClasses} bg-green-600 text-white cursor-default`
    }
    if (claimFundsMutation.isError) {
      return `${baseClasses} bg-red-600 hover:bg-red-500 text-white cursor-pointer`
    }
    if (alreadyClaimed) {
      return `${baseClasses} bg-gray-700 text-gray-400 cursor-not-allowed`
    }
    return `${baseClasses} bg-fpblock hover:opacity-90 hover:cursor-pointer`
  }

  return (
    <div className="flex flex-col items-center space-y-2">
      <button
        type="button"
        onClick={handleClaimFunds}
        disabled={
          alreadyClaimed ||
          claimFundsMutation.isPending ||
          claimFundsMutation.isSuccess
        }
        className={getButtonClassName()}
      >
        {getButtonText()}
      </button>
    </div>
  )
}

export default ClaimFunds
