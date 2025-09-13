#!/bin/bash

echo "========================================"
echo "   BarStockWise - Démarrage Local"
echo "========================================"
echo

echo "[1/4] Vérification des prérequis..."
if ! command -v python3 &> /dev/null; then
    echo "ERREUR: Python3 n'est pas installé"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "ERREUR: Node.js n'est pas installé"
    exit 1
fi

echo "[2/4] Préparation du backend Django..."
cd backend

if [ ! -d "venv" ]; then
    echo "Création de l'environnement virtuel..."
    python3 -m venv venv
fi

echo "Activation de l'environnement virtuel..."
source venv/bin/activate

echo "Installation des dépendances Python..."
pip install -r requirements.txt --quiet

echo "Application des migrations..."
python manage.py migrate --verbosity=0

echo "[3/4] Préparation du frontend React..."
cd ..

if [ ! -d "node_modules" ]; then
    echo "Installation des dépendances Node.js..."
    npm install --silent
fi

echo "[4/4] Démarrage des services..."
echo
echo "Backend Django: http://localhost:8000"
echo "Frontend React: http://localhost:5173"
echo
echo "Appuyez sur Ctrl+C pour arrêter les services"
echo

# Démarrer le backend en arrière-plan
cd backend
source venv/bin/activate
python manage.py runserver &
BACKEND_PID=$!

# Attendre que le backend démarre
sleep 3

# Démarrer le frontend
cd ..
npm run dev &
FRONTEND_PID=$!

echo "Services démarrés avec succès!"
echo "Ouvrez votre navigateur sur: http://localhost:5173"
echo
echo "PIDs des processus:"
echo "Backend: $BACKEND_PID"
echo "Frontend: $FRONTEND_PID"
echo
echo "Pour arrêter les services:"
echo "kill $BACKEND_PID $FRONTEND_PID"

# Attendre que l'utilisateur arrête les services
wait
