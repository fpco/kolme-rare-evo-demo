import Content from './components/Content/Index'
import Footer from './components/Footer/Index'
import Header from './components/Header/Index'

function App() {
  return (
    <div className="w-full 2xl:w-2/3 flex flex-col space-y-4 px-3 md:px-2 overflow-x-hidden">
      <Header />
      <Content />
      <Footer />
    </div>
  )
}

export default App
