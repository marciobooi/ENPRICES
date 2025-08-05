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

  // State for selected countries (defaults to EU27)
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['EU27_2020']);
  // State for selected category (defaults to climate)
  const [selectedCategory, setSelectedCategory] = useState<string>('climate');

  const handleCountriesChange = (countries: string[]) => {
    setSelectedCountries(countries);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  return (
    <div className="ecl">
      <Meta />
      <Nav 
        selectedCountries={selectedCountries}
        onCountriesChange={handleCountriesChange}
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
