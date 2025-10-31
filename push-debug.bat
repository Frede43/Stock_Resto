@echo off
echo ========================================
echo Push Outil de Diagnostic
echo ========================================
echo.

git add public/debug-production.html
git add POURQUOI_LOCAL_MARCHE_PAS_PRODUCTION.md
git commit -m "debug: Add production diagnostic tool"
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
echo MAINTENANT:
echo.
echo 1. Aller sur https://dashboard.render.com
echo 2. Cliquer sur barstock-web
echo 3. Manual Deploy -^> Clear cache ^& deploy
echo 4. Attendre 3-5 minutes
echo.
echo 5. Puis OUVRIR:
echo    https://barstock-web.onrender.com/debug-production.html
echo.
echo    (PAS en local, mais sur le site Render!)
echo.
pause
