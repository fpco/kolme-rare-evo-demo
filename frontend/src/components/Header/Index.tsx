import Card from '../Card/Index'
import WalletConnection from '../WalletConnection/Index'
import ClaimFunds from '../ClaimFunds/Index'

const Header = () => {
  return (
    <Card className="w-full flex justify-between items-center rounded-b-xl md:mt-2 md:p-0 bg-black/30 md:bg-transparent">
      <p className="text-3xl font-bold font-montserrat md:px-4">Kolme</p>
      <div className="flex items-center space-x-4">
        <div className="md:bg-black/30 md:p-4 rounded-xl flex space-x-4">
          <ClaimFunds />
          <WalletConnection />
        </div>
      </div>
    </Card>
  )
}

export default Header
