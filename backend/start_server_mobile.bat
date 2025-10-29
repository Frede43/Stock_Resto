@echo off
echo ========================================
echo   Demarrage Backend pour Mobile
echo ========================================
echo.
echo Backend accessible depuis:
echo - Android Emulator: http://10.0.2.2:8000
echo - Appareil physique: http://[VOTRE_IP]:8000
echo.
cd /d "%~dp0"
call venv\Scripts\activate
python manage.py runserver 0.0.0.0:8000
pause
