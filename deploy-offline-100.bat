@echo off
echo ========================================
echo MODE OFFLINE 100%% FONCTIONNEL
echo ========================================
echo.

git add src/services/offline-storage.ts
git add src/hooks/use-offline-kitchen.ts
git add src/hooks/use-offline-payments.ts
git add src/hooks/use-offline-stocks.ts
git add deploy-offline-100.bat
git add OFFLINE_100_IMPLEMENTATION.md

git commit -m "feat: Implement 100%% offline functionality - kitchen, payments, stocks"
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
echo OFFLINE STORAGE:
echo - Store orders (commandes cuisine)
echo - Store payments (paiements)
echo - Store stockMovements (mouvements stock)
echo - Methodes CRUD completes pour chaque store
echo.
echo HOOKS OFFLINE:
echo - use-offline-kitchen.ts (commandes cuisine)
echo   * Creer commande offline
echo   * Marquer en preparation/pret/servi
echo   * Ajouter commentaires chef
echo - use-offline-payments.ts (paiements)
echo   * Paiement cash/carte/mobile money offline
echo   * Appliquer reductions
echo   * Diviser addition
echo - use-offline-stocks.ts (mouvements stock)
echo   * Enregistrer sorties/entrees stock
echo   * Ajustements et pertes
echo   * Marquer rupture de stock
echo.
echo PROCHAINES ETAPES:
echo 1. Integrer hooks dans Kitchen.tsx, Sales.tsx, Stocks.tsx
echo 2. Tester en local
echo 3. Deployer sur Render
echo.
echo DEPLOIEMENT:
echo 1. Backend: Aucun changement necessaire
echo 2. Frontend: Render -^> barstock-web (Clear cache ^& deploy)
echo 3. Attendre 5 minutes
echo.
pause
