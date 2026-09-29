import { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { ScholarshipPage } from './pages/ScholarshipPage';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>('/scholarship');

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-slate-800">
      <Header currentPath={currentPath} onNavigate={setCurrentPath} />

      <main className="flex-1">
        {currentPath === '/' ? (
          <LandingPage onNavigateToScholarship={() => setCurrentPath('/scholarship')} />
        ) : (
          <ScholarshipPage />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
