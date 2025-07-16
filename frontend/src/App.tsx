import Content from './components/Content/Index'
import Footer from './components/Footer/Index'
import Header from './components/Header/Index'

function App() {
  return (
    <div className="min-w-2/3 flex flex-col space-y-4">
      <Header />
      <Content />
      <Footer />
    </div>
  )
}

export default App
