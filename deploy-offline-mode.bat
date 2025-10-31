@echo off
echo ========================================
echo MODE HORS LIGNE (OFFLINE-FIRST)
echo ========================================
echo.

git add public/sw.js
git add public/manifest.json
git add src/services/offline-storage.ts
git add src/hooks/use-offline-sync.ts
git add src/components/OfflineIndicator.tsx
git add src/main.tsx
git add src/App.tsx
git add package.json
git add package-lock.json
git add OFFLINE_MODE_GUIDE.md
git add deploy-offline-mode.bat

git commit -m "feat: Add offline-first mode with Service Worker, IndexedDB and auto-sync"
if %errorlevel% neq 0 (
    echo Erreur lors du commit
    pause
    exit /b 1
)

echo.
echo Commit reussi! Push vers GitHub...
echo.

git push origin main
if %errorlevel% neq 0 (
    echo Erreur lors du push
    pause
    exit /b 1
)

echo.
echo ========================================
echo Push reussi!
echo ========================================
echo.
echo FONCTIONNALITES AJOUTEES:
echo.
echo SERVICE WORKER (PWA):
echo - Cache fichiers statiques (HTML, CSS, JS)
echo - Cache reponses API
echo - Strategie Network First pour API
echo - Strategie Cache First pour fichiers
echo.
echo INDEXEDDB:
echo - Store: sales (ventes avec flag synced)
echo - Store: tables (tables en cache)
echo - Store: products (produits en cache)
echo - Store: syncQueue (file de synchronisation)
echo.
echo SYNCHRONISATION AUTO:
echo - Detection connexion/deconnexion internet
echo - Sync automatique toutes les 30 secondes
echo - File d'attente pour actions offline
echo - Notifications toast (online/offline/sync)
echo.
echo INDICATEUR VISUEL:
echo - Badge "En ligne" (vert) / "Hors ligne" (rouge)
echo - Compteur elements en attente
echo - Bouton "Synchroniser maintenant"
echo - Animation de synchronisation
echo.
echo DEPLOIEMENT:
echo 1. Backend: Render -^> barstock-api (aucun changement)
echo 2. Frontend: Render -^> barstock-web (Clear cache ^& deploy)
echo 3. Attendre 5 minutes
echo.
echo TESTS A FAIRE:
echo 1. Couper internet -^> Badge "Hors ligne"
echo 2. Creer une vente -^> Sauvegardee localement
echo 3. Retablir internet -^> Toast "Synchronisation..."
echo 4. Verifier vente synchronisee
echo 5. Actualiser page offline -^> Donnees en cache
echo.
pause
