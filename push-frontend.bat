@echo off
echo ========================================
echo Force Frontend Rebuild
echo ========================================
echo.

git commit -m "chore: Force frontend rebuild with correct API URL"
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
echo IMPORTANT: Maintenant vous DEVEZ:
echo.
echo 1. Aller sur https://dashboard.render.com
echo 2. Cliquer sur barstock-web (FRONTEND)
echo 3. Cliquer sur Manual Deploy
echo 4. COCHER: Clear build cache ^& deploy
echo 5. Cliquer sur Deploy
echo 6. Attendre 3-5 minutes
echo.
echo 7. Tester en navigation privee:
echo    - Ouvrir https://barstock-web.onrender.com
echo    - Se connecter
echo    - Ouvrir console (F12)
echo    - Creer une table
echo    - Verifier que l'URL est: https://barstock-api.onrender.com
echo.
pause
