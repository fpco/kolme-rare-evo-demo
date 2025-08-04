import { useAccountId, useUserFunds } from '../../hooks/useUserFunds'
import Card from '../Card/Index'
import ClaimFunds from '../ClaimFunds/Index'
import NewUser from '../NewUser/Index'

const Header = () => {
  const { data: userFunds, isLoading: fundsLoading } = useUserFunds()
  const { data: accountData, isLoading: accountLoading } = useAccountId()

  // this is to avoid a render if the user hasn't claimed funds yet
  // because if we fetch instantly, it will return an account ID that doesn't exist yer
  const hasClaimed = userFunds?.claimed || false
  const shouldShowAccountInfo = hasClaimed && userFunds && accountData?.found

  return (
    <Card className="w-full flex justify-between items-center rounded-b-xl md:mt-2 md:p-0">
      <div className="md:px-4">
        <img 
          src="/KolmeLogo.svg" 
          alt="Kolme" 
          className="h-4 md:h-8 w-auto"
        />
      </div>
      <div className="flex items-center space-x-1 md:space-x-4">
        <div className="md:p-4 rounded-xl flex items-center space-x-1 md:space-x-4">
          <div className="hidden md:block text-left">
            {shouldShowAccountInfo ? (
              <div className="animate-fade-in">
                <div className="text-sm text-gray-400">Current User</div>
                <div className="text-xs text-blue-400 font-semibold">
                  Account ID: #{accountData.found.account_id}
                </div>
                <div className="text-xs text-green-400 font-semibold">
                  Funds: {userFunds.funds}
                </div>
              </div>
            ) : fundsLoading || accountLoading ? (
              <div className="text-sm text-gray-400">Loading...</div>
            ) : !hasClaimed ? (
              <div className="text-sm text-gray-400">Claim funds to start!</div>
            ) : (
              <div className="text-sm text-red-400">Failed to load user data</div>
            )}
          </div>

          {/* mobile view */}
          <div className="md:hidden flex flex-col text-xs text-center min-w-0">
            {userFunds && accountData?.found ? (
              <div className="animate-fade-in">
              <div className="text-green-400 font-semibold text-xs">
                F: {userFunds.funds}
              </div>
              <div className="text-blue-400 text-xs">
                ID: {accountData.found.account_id}
              </div>
              </div>
            ) : fundsLoading || accountLoading && (
              <div className="text-gray-400 text-xs">...</div>
            )}
          </div>
          <ClaimFunds />
          <NewUser />
        </div>
      </div>
    </Card>
  )
}

export default Header
