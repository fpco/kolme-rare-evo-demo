import Card from '../Card/Index'

const Header = () => {
  return (
    <Card className="w-full flex justify-between rounded-b-xl bg-black/30">
      <div>Kolme Logo</div>
      <div>
        <h1 className="text-[#FF9409]">Connected Wallet Info</h1>
        <h2 className="text-sm">wallet-id</h2>
      </div>
    </Card>
  )
}

export default Header
