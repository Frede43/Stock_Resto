import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Enregistrer le Service Worker pour le mode offline
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker enregistré:', registration.scope);
      })
      .catch(error => {
        console.error('❌ Erreur Service Worker:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
