import './App.css'
import { useState } from 'react'
import { useWebtoolsInit } from './hooks/useWebtools'
import { useLanguageSync } from './hooks/useLanguageSync'
import { useECLInit } from './hooks/useECL'
import Nav from './components/Nav'
import MainContent from './components/MainContent'
import Footer from './components/Footer'
import Meta from './components/Meta'
// Removed Chart import
// ...existing code...
// ...existing code...

function App() {
  useWebtoolsInit();
  useLanguageSync();
  useECLInit();

  // State for selected country (defaults to Austria)
  const [selectedCountry, setSelectedCountry] = useState<string>('AT');
  // State for selected category (defaults to climate)
  const [selectedCategory, setSelectedCategory] = useState<string>('climate');

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="ecl">
      <Meta />
      <Nav 
        selectedCountry={selectedCountry}
        onCountryChange={handleCountryChange}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        hideCategoryButtons={false}
      />
        <MainContent />
        <Footer />
    </div>
  );
}


export default App
