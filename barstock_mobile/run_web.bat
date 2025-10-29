@echo off
echo ========================================
echo  BAR STOCK MOBILE - LANCEMENT WEB
echo ========================================
echo.

echo [1/3] Nettoyage du cache...
call flutter clean >nul 2>&1

echo [2/3] Installation des dependances...
call flutter pub get

echo [3/3] Lancement de l'application...
echo.
echo Application disponible sur: http://localhost:PORT
echo Appuyez sur 'r' pour hot reload
echo Appuyez sur 'q' pour quitter
echo.

flutter run -d chrome

pause
