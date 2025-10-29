#!/usr/bin/env bash
# Script de build pour Render

set -o errexit  # Arrêter si une commande échoue

echo "📂 Dossier de travail: $(pwd)"

echo "🔧 Installation des dépendances..."
pip install --upgrade pip setuptools>=65.5.0
pip install -r requirements.txt

echo "📁 Collecte des fichiers statiques..."
python manage.py collectstatic --no-input --clear

echo "🗄️ Exécution des migrations..."
python manage.py migrate --no-input

echo "👤 Création du superutilisateur..."
python create_superuser.py

echo "✅ Build terminé !"
