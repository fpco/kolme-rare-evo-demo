import { useAccount, useConnect, useDisconnect } from 'graz'
import { useState } from 'react'

interface WalletConnectionProps {
  className?: string
}

const WalletConnection = ({ className = '' }: WalletConnectionProps) => {
  const {
    data: account,
    isConnected,
    isConnecting,
    isReconnecting,
  } = useAccount()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    try {
      setError(null)
      console.log('Attempting to connect wallet...')

      // Check if Keplr is installed
      if (!window.keplr) {
        console.log('Keplr not found')
        setError(
          'Keplr wallet is not installed. Please install Keplr extension.',
        )
        return
      }

      console.log('Keplr found, attempting connection...')

      // Try connecting with just the chainId first
      const result = await connect({
        chainId: 'cosmoshub-4',
      })

      console.log('Connection result:', result)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      setError(
        `Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const truncateAddress = (address: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (isConnecting || isReconnecting) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-fpblock" />
          <span className="text-sm">Connecting...</span>
        </div>
      </div>
    )
  }

  if (isConnected && account) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-fpblock font-semibold text-sm">Wallet</h1>
            <h3 className="text-xs text-gray-400 truncate">
              {truncateAddress(account.bech32Address)}
            </h3>
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <h2 className="text-sm font-medium truncate">
              {account.name || '-'}
            </h2>
            <span className="text-xs text-green-400">Connected</span>
          </div>
          <button
            type="button"
            onClick={handleDisconnect}
            className="text-md cursor-pointer text-red-400 hover:text-red-300 transition-colors whitespace-nowrap px-2 py-1 rounded hover:bg-red-400/10"
          >
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {error && <div className="mb-2 text-red-400 text-xs">{error}</div>}
      <button
        type="button"
        onClick={handleConnect}
        className="bg-fpblock hover:bg-orange-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm"
      >
        Connect Wallet
      </button>
    </div>
  )
}

export default WalletConnection
