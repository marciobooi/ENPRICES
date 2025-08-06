import './App.css'
import { useWebtoolsInit } from './hooks/useWebtools'
import { useLanguageSync } from './hooks/useLanguageSync'
import { useECLInit } from './hooks/useECL'
import { QueryProvider } from './context/QueryContext'
import Nav from './components/Nav'
import MainContent from './components/MainContent'
import Footer from './components/Footer'
import Meta from './components/Meta'


function App() {
  useWebtoolsInit();
  useLanguageSync();
  useECLInit();



  return (
    <QueryProvider>
      <div className="ecl">
        <Meta />
        <Nav />
          <MainContent />
          <Footer />
      </div>
    </QueryProvider>
  );
}


export default App
