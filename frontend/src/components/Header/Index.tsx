import { publicKey } from '../../client'
import { useUserFunds } from '../../hooks/useUserFunds'
import Card from '../Card/Index'
import ClaimFunds from '../ClaimFunds/Index'

const Header = () => {
  const { data: userFunds } = useUserFunds()

  if (!userFunds) {
    return (
      <Card className="w-full flex justify-between items-center rounded-b-xl md:mt-2 md:p-0 bg-black/30 md:bg-transparent">
        <p className="text-3xl font-bold font-montserrat md:px-4">Kolme</p>
        <div className="flex items-center space-x-4">
          <div className="md:bg-black/30 md:p-4 rounded-xl flex items-center space-x-4">
            <div className="hidden md:block text-left">
              <div className="text-sm text-gray-400">Loading...</div>
            </div>
            <ClaimFunds />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="w-full flex justify-between items-center rounded-b-xl md:mt-2 md:p-0 bg-black/30 md:bg-transparent">
      <p className="text-3xl font-bold font-montserrat md:px-4">Kolme</p>
      <div className="flex items-center space-x-4">
        <div className="md:bg-black/30 md:p-4 rounded-xl flex items-center space-x-4">
          <div className="hidden md:block text-left">
            <div className="text-sm text-gray-400">Current User</div>
            <div className="text-white font-mono text-xs">{publicKey}</div>
            <div className="text-xs text-green-400 font-semibold">
              Funds: {userFunds.funds}
            </div>
          </div>
          <ClaimFunds />
        </div>
      </div>
    </Card>
  )
}

export default Header
