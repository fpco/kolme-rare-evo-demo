import Card from '../Card/Index'

const Header = () => {
  return (
    <Card className="w-full flex justify-between items-center rounded-b-xl md:mt-2 md:p-0 bg-black/30 md:bg-transparent">
      <p className="text-3xl font-bold font-montserrat md:px-4">Kolme</p>
      <div className="md:bg-black/30 md:p-4 rounded-xl">
        <h1 className="text-[#FF9409]">Connected Wallet Info</h1>
        <h2 className="text-sm truncate">wallet-id</h2>
      </div>
    </Card>
  )
}

export default Header
