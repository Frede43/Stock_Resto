@echo off
echo ========================================
echo FIX COMPLET - Toutes les URLs Hardcodees
echo ========================================
echo.

git commit -m "fix: Replace all hardcoded localhost URLs with dynamic API URLs in TableDetails, Sales, and Kitchen"
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
echo FICHIERS CORRIGES:
echo - TableDetails.tsx (details table, ventes, status)
echo - Sales.tsx (facture imprimable)
echo - Kitchen.tsx (recettes, prix)
echo - Tables.tsx (deja corrige)
echo.
echo MAINTENANT:
echo 1. Aller sur https://dashboard.render.com
echo 2. Cliquer sur barstock-web
echo 3. Manual Deploy -^> Clear cache ^& deploy
echo 4. Attendre 3-5 minutes
echo.
echo 5. TESTER EN PRODUCTION:
echo    a) Aller sur /tables
echo    b) Cliquer sur une table
echo    c) Voir les details et ventes
echo    d) CA DOIT FONCTIONNER!
echo.
pause
