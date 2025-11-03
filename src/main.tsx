import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Service Worker désactivé - Application en ligne uniquement
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then(registration => {
//         console.log('✅ Service Worker enregistré:', registration.scope);
//       })
//       .catch(error => {
//         console.error('❌ Erreur Service Worker:', error);
//       });
//   });
// }

// Désenregistrer les service workers existants
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('🗑️ Service Worker désenregistré');
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
