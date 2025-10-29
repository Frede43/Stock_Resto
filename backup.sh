#!/bin/bash
# backup.sh

echo "💾 Sauvegarde de BarStock..."

# Créer le répertoire de sauvegarde
mkdir -p backups

# Sauvegarde de la base de données
echo "📊 Sauvegarde de la base de données..."
docker-compose exec db pg_dump -U barstock_user barstock_prod > backups/db_backup_$(date +%Y%m%d_%H%M%S).sql

# Sauvegarde des fichiers média
echo "📁 Sauvegarde des fichiers média..."
docker-compose exec web tar -czf /tmp/media_backup.tar.gz media/
docker cp $(docker-compose ps -q web):/tmp/media_backup.tar.gz backups/media_backup_$(date +%Y%m%d_%H%M%S).tar.gz

echo "✅ Sauvegarde terminée!"