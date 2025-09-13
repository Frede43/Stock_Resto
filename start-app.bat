@echo off
echo ========================================
echo    BarStockWise - Demarrage Local
echo ========================================
echo.

echo [1/4] Verification des prerequis...
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ERREUR: Python n'est pas installe ou pas dans le PATH
    pause
    exit /b 1
)

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERREUR: Node.js n'est pas installe ou pas dans le PATH
    pause
    exit /b 1
)

echo [2/4] Preparation du backend Django...
cd backend
if not exist "venv" (
    echo Creation de l'environnement virtuel...
    python -m venv venv
)

echo Activation de l'environnement virtuel...
call venv\Scripts\activate.bat

echo Installation des dependances Python...
pip install -r requirements.txt --quiet

echo Application des migrations...
python manage.py migrate --verbosity=0

echo [3/4] Preparation du frontend React...
cd ..
if not exist "node_modules" (
    echo Installation des dependances Node.js...
    npm install --silent
)

echo [4/4] Demarrage des services...
echo.
echo Backend Django: http://localhost:8000
echo Frontend React: http://localhost:5173
echo Network Access: http://192.168.43.253:5173
echo.
echo Appuyez sur Ctrl+C pour arreter les services
echo.

start "BarStockWise Backend" cmd /k "cd backend && venv\Scripts\activate && python manage.py runserver"
timeout /t 3 /nobreak >nul
start "BarStockWise Frontend" cmd /k "npm run dev"

echo Services demarres avec succes!
echo Ouvrez votre navigateur sur: http://localhost:5173
echo Ou depuis le reseau: http://192.168.43.253:5173
echo Connectez-vous avec: admin / admin123
pause
