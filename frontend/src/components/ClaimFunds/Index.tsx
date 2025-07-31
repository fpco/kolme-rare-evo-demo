import { useEffect, useState } from 'react'

import { useAutoDismiss } from '../../hooks/useAutoDismiss'
import { useClaimFunds } from '../../hooks/useGameActions'
import { hasClaimedFunds } from '../../kolmeclient'

const ClaimFunds = () => {
  const claimFundsMutation = useClaimFunds()
  const [, setRefresh] = useState(0)
  const alreadyClaimed = hasClaimedFunds()

  useAutoDismiss(claimFundsMutation, 4000)

  // Listen for funds updates to refresh the component
  useEffect(() => {
    const handleFundsUpdate = () => {
      setRefresh((prev) => prev + 1)
    }

    window.addEventListener('fundsUpdated', handleFundsUpdate)
    return () => window.removeEventListener('fundsUpdated', handleFundsUpdate)
  }, [])

  const handleClaimFunds = async () => {
    try {
      await claimFundsMutation.mutateAsync()
    } catch {}
  }

  const getButtonText = () => {
    if (claimFundsMutation.isPending) {
      return 'Processing...'
    }
    if (claimFundsMutation.isSuccess) {
      return 'Claimed!'
    }
    if (claimFundsMutation.isError) {
      return 'Failed - Retry'
    }
    if (alreadyClaimed) {
      return 'Already Claimed'
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
      return `${baseClasses} bg-gray-600 text-white cursor-not-allowed`
    }
    return `${baseClasses} bg-fpblock hover:opacity-90 hover:cursor-pointer disabled:bg-gray-600 text-white`
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
