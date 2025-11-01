@echo off
echo ========================================
echo DEPLOIEMENT : Fix Filtre Plats
echo ========================================
echo.

echo [1/6] Verification des changements...
git status

echo.
echo [2/6] Ajout des fichiers modifies...
git add src/pages/Kitchen.tsx
git add backend/products/serializers.py

echo.
echo [3/6] Commit des changements...
git commit -m "fix: Filtre des plats dans dialog recette - Ajouter category_type au ProductListSerializer et ameliorer le filtre frontend"

echo.
echo [4/6] Build du frontend...
call npm run build

echo.
echo [5/6] Push vers GitHub...
git push origin main

echo.
echo ========================================
echo DEPLOIEMENT TERMINE !
echo ========================================
echo.
echo PROCHAINES ETAPES SUR LE SERVEUR :
echo 1. git pull
echo 2. cd backend ^&^& python manage.py collectstatic --noinput
echo 3. sudo systemctl restart gunicorn
echo 4. Copier le dossier dist/ vers /var/www/stock_resto/
echo.
pause
