#!/bin/bash

# Script pour démarrer tous les services BarStockWise

echo "🚀 Démarrage des services BarStockWise..."

# Vérifier que Redis est démarré
echo "📡 Vérification de Redis..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis n'est pas démarré. Veuillez démarrer Redis d'abord."
    echo "   Sur Ubuntu/Debian: sudo systemctl start redis-server"
    echo "   Sur macOS: brew services start redis"
    echo "   Sur Windows: Démarrer Redis manuellement"
    exit 1
fi
echo "✅ Redis est actif"

# Activer l'environnement virtuel si il existe
if [ -d "venv" ]; then
    echo "🐍 Activation de l'environnement virtuel..."
    source venv/bin/activate
fi

# Installer les dépendances WebSocket si nécessaire
echo "📦 Installation des dépendances WebSocket..."
pip install -r requirements-websockets.txt

# Appliquer les migrations
echo "🗄️ Application des migrations..."
python manage.py migrate

# Démarrer les services en arrière-plan
echo "🔄 Démarrage des services..."

# 1. Serveur Django avec Daphne (WebSocket support)
echo "🌐 Démarrage du serveur Django (Daphne)..."
daphne -b 0.0.0.0 -p 8000 barstock_api.asgi:application &
DJANGO_PID=$!

# 2. Worker Celery
echo "⚙️ Démarrage du worker Celery..."
celery -A barstock_api worker --loglevel=info &
CELERY_PID=$!

# 3. Scheduler Celery Beat
echo "⏰ Démarrage du scheduler Celery Beat..."
celery -A barstock_api beat --loglevel=info &
BEAT_PID=$!

# Attendre un peu pour que les services démarrent
sleep 3

echo ""
echo "🎉 Tous les services sont démarrés !"
echo ""
echo "📊 Services actifs :"
echo "   - Django (WebSocket): http://localhost:8000 (PID: $DJANGO_PID)"
echo "   - Celery Worker: PID $CELERY_PID"
echo "   - Celery Beat: PID $BEAT_PID"
echo ""
echo "📝 Logs :"
echo "   - Django: Visible dans ce terminal"
echo "   - Celery: Visible dans les terminaux séparés"
echo ""
echo "🛑 Pour arrêter tous les services :"
echo "   kill $DJANGO_PID $CELERY_PID $BEAT_PID"
echo "   ou utilisez Ctrl+C puis ./stop-services.sh"
echo ""

# Fonction pour nettoyer à la sortie
cleanup() {
    echo ""
    echo "🛑 Arrêt des services..."
    kill $DJANGO_PID $CELERY_PID $BEAT_PID 2>/dev/null
    echo "✅ Services arrêtés"
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT SIGTERM

# Attendre que l'utilisateur arrête les services
echo "Appuyez sur Ctrl+C pour arrêter tous les services..."
wait
