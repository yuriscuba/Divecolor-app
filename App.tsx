
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Editor from './components/Editor';
import SpeciesIdentifier from './components/SpeciesIdentifier';
import Logbook from './components/Logbook';
import Gallery from './components/Gallery';
import { EditIcon } from './components/icons/EditIcon';
import { FishIcon } from './components/icons/FishIcon';
import { BookIcon } from './components/icons/BookIcon';
import { ImageIcon } from './components/icons/ImageIcon';
import { migrateFromLocalStorage } from './utils/dbService';
import LoadingSpinner from './components/LoadingSpinner';

type Feature = 'edit' | 'species' | 'logbook' | 'gallery';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>('edit');
  const [isMigrating, setIsMigrating] = useState(true);

  useEffect(() => {
    const runMigration = async () => {
      await migrateFromLocalStorage();
      setIsMigrating(false);
    };
    runMigration();
  }, []);

  const navButtonClasses = (feature: Feature) => 
    `flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 ${
      activeFeature === feature
        ? 'bg-cyan-600 text-white'
        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
    }`;

  if (isMigrating) {
    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 flex items-center justify-center">
            <LoadingSpinner text="Updating application data..." />
        </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-slate-900 text-slate-200"
      style={{
        boxShadow: 'inset -2px -2px 5px rgba(41, 55, 79, 0.25), inset 2px 2px 5px rgba(0, 0, 0, 0.5)'
      }}
    >
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button onClick={() => setActiveFeature('edit')} className={navButtonClasses('edit')}>
            <EditIcon className="h-5 w-5" />
            <span>Edit</span>
          </button>
          <button onClick={() => setActiveFeature('species')} className={navButtonClasses('species')}>
            <FishIcon className="h-5 w-5" />
            <span>Species ID</span>
          </button>
          <button onClick={() => setActiveFeature('logbook')} className={navButtonClasses('logbook')}>
            <BookIcon className="h-5 w-5" />
            <span>Dive Logbook</span>
          </button>
          <button onClick={() => setActiveFeature('gallery')} className={navButtonClasses('gallery')}>
            <ImageIcon className="h-5 w-5" />
            <span>Photo Gallery</span>
          </button>
        </div>
        
        <div>
          {activeFeature === 'edit' && <Editor />}
          {activeFeature === 'species' && <SpeciesIdentifier />}
          {activeFeature === 'logbook' && <Logbook />}
          {activeFeature === 'gallery' && <Gallery />}
        </div>
      </main>
      <footer className="text-center py-4 mt-8 text-slate-500 text-sm">
        <p>DiveColor Pro &copy; {new Date().getFullYear()}. AI-powered tools for the modern diver.</p>
      </footer>
    </div>
  );
};

export default App;
