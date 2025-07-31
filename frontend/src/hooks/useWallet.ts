import { useAccount } from 'graz'

export const useWallet = () => {
  const { data: account, isConnected, isConnecting, isReconnecting } = useAccount()

  return {
    account,
    isConnected,
    isConnecting,
    isReconnecting,
    walletAddress: account?.bech32Address,
    walletName: account?.name,
  }
}
