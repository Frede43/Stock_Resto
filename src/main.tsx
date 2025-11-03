import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { backgroundSync } from './services/background-sync'

// Enregistrer le Service Worker pour le mode offline avec Background Sync
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Enregistrer le Service Worker via le service
      const registered = await backgroundSync.registerServiceWorker();

      if (registered) {
        console.log('✅ Service Worker et Background Sync initialisés');

        // Afficher les infos
        const info = backgroundSync.getInfo();
        console.log('📊 Info Background Sync:', info);
      }
    } catch (error) {
      console.error('❌ Erreur initialisation Service Worker:', error);
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
