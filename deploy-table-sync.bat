@echo off
echo ========================================
echo SYSTEME DE SYNCHRONISATION TABLES
echo ========================================
echo.

git add backend/sales/signals.py
git add backend/sales/apps.py
git add backend/sales/views.py
git add backend/sales/urls.py
git add src/hooks/use-table-notifications.ts
git add src/pages/Tables.tsx
git add TABLE_SYNC_SYSTEM.md
git add deploy-table-sync.bat

git commit -m "feat: Add automatic table-sale synchronization system with real-time notifications"
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
echo BACKEND:
echo - Signaux Django pour sync auto tables ^<-^> ventes
echo - Vente creee -^> Table occupee (auto)
echo - Vente payee -^> Table liberee (auto)
echo - Systeme de notifications dans cache
echo - Endpoint GET /api/sales/notifications/tables/
echo.
echo FRONTEND:
echo - Hook useTableNotifications (polling 15s)
echo - Toast automatique quand table liberee
echo - Badge notifications non lues
echo - Affichage client/serveur sur tables occupees
echo - Bouton "Creer une vente" sur tables dispo
echo - Bouton "Voir la vente" sur tables occupees
echo - Auto-refresh toutes les 30s
echo.
echo DEPLOIEMENT:
echo 1. Backend: Render -^> barstock-api (auto-deploy)
echo 2. Frontend: Render -^> barstock-web (Clear cache ^& deploy)
echo 3. Attendre 5 minutes
echo.
echo TESTS A FAIRE:
echo 1. Creer une vente -^> Table devient occupee
echo 2. Payer la vente -^> Toast "Table liberee!"
echo 3. Verifier badge notifications (cloche rouge)
echo 4. Verifier infos client/serveur sur table
echo.
pause
