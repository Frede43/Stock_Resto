#!/bin/bash
# deploy.sh

echo "🚀 Déploiement de BarStock..."

# Arrêter les services existants
docker-compose down

# Construire les images
echo "🔨 Construction des images..."
docker-compose build

# Démarrer les services
echo "▶️ Démarrage des services..."
docker-compose up -d

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
sleep 10

# Migrations
echo "🔄 Application des migrations..."
docker-compose exec web python manage.py migrate

# Créer un superutilisateur si nécessaire
echo "👤 Création du superutilisateur..."
docker-compose exec web python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@barstock.com', 'admin123', role='admin')
    print('Superutilisateur créé')
else:
    print('Superutilisateur existe déjà')
"

echo "✅ Déploiement terminé!"
echo "🌐 Application disponible sur: http://localhost"
echo "🔧 Admin Django: http://localhost/admin"