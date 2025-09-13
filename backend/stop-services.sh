#!/bin/bash

# Script pour arrêter tous les services BarStockWise

echo "🛑 Arrêt des services BarStockWise..."

# Arrêter les processus Django/Daphne
echo "🌐 Arrêt du serveur Django..."
pkill -f "daphne.*barstock_api.asgi"
pkill -f "python.*manage.py.*runserver"

# Arrêter les processus Celery
echo "⚙️ Arrêt des workers Celery..."
pkill -f "celery.*worker"
pkill -f "celery.*beat"

# Attendre un peu
sleep 2

echo "✅ Tous les services ont été arrêtés"
