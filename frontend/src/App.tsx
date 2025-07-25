import { useEffect } from 'react';
import Content from './components/Content/Index'
import Footer from './components/Footer/Index'
import Header from './components/Header/Index'
import { client, privateKey } from './kolmeclient';

function App() {

  useEffect(() => {
    
    client.subscribeToNotifications(
      (message) => {  
        console.log('Received message:', message);
    },
      (socketState) => {  
      }
    )
  }, []);
  
  return (
    <div className="w-full 2xl:w-2/3 flex flex-col space-y-4 md:px-2">
      <Header />
      <Content />
      <Footer />
    </div>
  )
}

export default App
