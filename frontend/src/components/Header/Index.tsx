import Card from '../Card/Index'
import ClaimFunds from '../ClaimFunds/Index'
import UserSwitcher from '../UserSwitcher/Index'
import { getCurrentUser } from '../../kolmeclient'

const Header = () => {
  const currentUser = getCurrentUser()

  return (
    <Card className="w-full flex justify-between items-center rounded-b-xl md:mt-2 md:p-0 bg-black/30 md:bg-transparent">
      <p className="text-3xl font-bold font-montserrat md:px-4">Kolme</p>
      <div className="flex items-center space-x-4">
       
        
        <div className="md:bg-black/30 md:p-4 rounded-xl flex items-center space-x-4">
         {/* Current User Info */}
        <div className="hidden md:block text-right">
          <div className="text-sm text-gray-400">Current User</div>
          <div className="text-white font-mono text-xs">{currentUser.shortAddress}</div>
          <div className="text-xs text-gray-500">Key: {currentUser.encryptionKey}</div>
        </div>
          <UserSwitcher />
          <ClaimFunds />
        </div>
      </div>
    </Card>
  )
}

export default Header
