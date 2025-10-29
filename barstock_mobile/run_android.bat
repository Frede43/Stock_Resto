@echo off
echo ========================================
echo  BAR STOCK MOBILE - LANCEMENT ANDROID
echo ========================================
echo.

echo [1/3] Verification des appareils...
call flutter devices

echo.
echo [2/3] Installation des dependances...
call flutter pub get

echo [3/3] Lancement sur Android...
echo.
echo Appuyez sur 'r' pour hot reload
echo Appuyez sur 'R' pour hot restart
echo Appuyez sur 'q' pour quitter
echo.

flutter run

pause
