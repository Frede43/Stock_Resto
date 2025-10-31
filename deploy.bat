@echo off
echo ========================================
echo Deploiement du fix table permissions
echo ========================================
echo.

git commit -m "fix: Remove strict table permissions for all authenticated users"
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
echo Prochaines etapes:
echo 1. Aller sur https://dashboard.render.com
echo 2. Cliquer sur barstock-api
echo 3. Manual Deploy -^> Clear cache ^& deploy
echo 4. Attendre 2-3 minutes
echo 5. Tester la creation de table
echo.
pause
