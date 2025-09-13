#!/usr/bin/env python3
"""
Vérification des prérequis pour le déploiement
"""

import subprocess
import sys
import os

def check_python():
    """Vérifier Python"""
    print("🐍 Vérification de Python...")
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print(f"✅ Python {version.major}.{version.minor}.{version.micro} - OK")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor}.{version.micro} - Version trop ancienne (requis: 3.8+)")
        return False

def check_node():
    """Vérifier Node.js"""
    print("📦 Vérification de Node.js...")
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ Node.js {version} - OK")
            return True
        else:
            print("❌ Node.js non trouvé")
            return False
    except FileNotFoundError:
        print("❌ Node.js non installé")
        print("💡 Installer depuis: https://nodejs.org/")
        return False

def check_npm():
    """Vérifier npm"""
    print("📦 Vérification de npm...")
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ npm {version} - OK")
            return True
        else:
            print("❌ npm non trouvé")
            return False
    except FileNotFoundError:
        print("❌ npm non installé")
        return False

def check_docker():
    """Vérifier Docker"""
    print("🐳 Vérification de Docker...")
    try:
        result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ {version} - OK")
            return True
        else:
            print("❌ Docker non trouvé")
            return False
    except FileNotFoundError:
        print("❌ Docker non installé")
        print("💡 Installer depuis: https://www.docker.com/get-started")
        return False

def check_docker_compose():
    """Vérifier Docker Compose"""
    print("🐳 Vérification de Docker Compose...")
    try:
        result = subprocess.run(['docker-compose', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ {version} - OK")
            return True
        else:
            # Essayer docker compose (nouvelle syntaxe)
            result = subprocess.run(['docker', 'compose', 'version'], capture_output=True, text=True)
            if result.returncode == 0:
                version = result.stdout.strip()
                print(f"✅ Docker Compose (intégré) {version} - OK")
                return True
            else:
                print("❌ Docker Compose non trouvé")
                return False
    except FileNotFoundError:
        print("❌ Docker Compose non installé")
        return False

def check_git():
    """Vérifier Git"""
    print("📝 Vérification de Git...")
    try:
        result = subprocess.run(['git', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"✅ {version} - OK")
            return True
        else:
            print("❌ Git non trouvé")
            return False
    except FileNotFoundError:
        print("❌ Git non installé")
        print("💡 Installer depuis: https://git-scm.com/")
        return False

def check_project_structure():
    """Vérifier la structure du projet"""
    print("📁 Vérification de la structure du projet...")
    
    required_dirs = ['backend', 'src']
    required_files = ['package.json', 'backend/manage.py']
    
    missing_items = []
    
    for dir_name in required_dirs:
        if not os.path.exists(dir_name):
            missing_items.append(f"Dossier: {dir_name}")
    
    for file_name in required_files:
        if not os.path.exists(file_name):
            missing_items.append(f"Fichier: {file_name}")
    
    if not missing_items:
        print("✅ Structure du projet - OK")
        return True
    else:
        print("❌ Structure du projet incomplète:")
        for item in missing_items:
            print(f"   - Manquant: {item}")
        return False

def check_deployment_files():
    """Vérifier les fichiers de déploiement générés"""
    print("🚀 Vérification des fichiers de déploiement...")
    
    deployment_files = [
        'Dockerfile',
        'docker-compose.yml',
        'nginx.conf',
        'deploy.sh',
        'backup.sh',
        'backend/requirements.txt'
    ]
    
    missing_files = []
    existing_files = []
    
    for file_name in deployment_files:
        if os.path.exists(file_name):
            existing_files.append(file_name)
        else:
            missing_files.append(file_name)
    
    if existing_files:
        print(f"✅ {len(existing_files)} fichier(s) de déploiement trouvé(s):")
        for file_name in existing_files:
            print(f"   ✓ {file_name}")
    
    if missing_files:
        print(f"⚠️ {len(missing_files)} fichier(s) manquant(s):")
        for file_name in missing_files:
            print(f"   - {file_name}")
        print("💡 Exécutez: python deploy_local.py")
    
    return len(missing_files) == 0

def show_deployment_options():
    """Afficher les options de déploiement selon les prérequis"""
    print("\n🎯 OPTIONS DE DÉPLOIEMENT DISPONIBLES:")
    print("="*50)
    
    # Vérifier les prérequis pour chaque option
    has_docker = check_docker() and check_docker_compose()
    has_node = check_node() and check_npm()
    has_git = check_git()
    
    print("\n1️⃣ DÉPLOIEMENT LOCAL AVEC DOCKER:")
    if has_docker:
        print("   ✅ Prérequis satisfaits")
        print("   📋 Commandes:")
        print("      python deploy_local.py")
        print("      bash deploy.sh")
    else:
        print("   ❌ Docker requis")
        print("   💡 Installer Docker Desktop")
    
    print("\n2️⃣ DÉVELOPPEMENT LOCAL:")
    if has_node:
        print("   ✅ Prérequis satisfaits")
        print("   📋 Commandes:")
        print("      # Frontend")
        print("      npm install")
        print("      npm run dev")
        print("      # Backend (terminal séparé)")
        print("      cd backend")
        print("      python manage.py runserver")
    else:
        print("   ❌ Node.js requis")
        print("   💡 Installer Node.js depuis nodejs.org")
    
    print("\n3️⃣ DÉPLOIEMENT CLOUD:")
    if has_git:
        print("   ✅ Git disponible")
        print("   📋 Options:")
        print("      • Heroku: git push heroku main")
        print("      • Digital Ocean: scp + docker")
        print("      • AWS/GCP: voir deploy_cloud_guide.md")
    else:
        print("   ❌ Git requis pour le déploiement cloud")

def main():
    """Fonction principale"""
    print("🎯 VÉRIFICATION DES PRÉREQUIS - BARSTOCK")
    print("="*60)
    
    # Vérifications des outils
    checks = [
        check_python(),
        check_node(),
        check_npm(),
        check_docker(),
        check_docker_compose(),
        check_git(),
        check_project_structure(),
        check_deployment_files()
    ]
    
    passed_checks = sum(checks)
    total_checks = len(checks)
    
    print("\n" + "="*60)
    print(f"📊 RÉSULTAT: {passed_checks}/{total_checks} vérifications réussies")
    
    if passed_checks == total_checks:
        print("🎉 TOUS LES PRÉREQUIS SONT SATISFAITS!")
        print("✅ Vous pouvez procéder au déploiement")
    elif passed_checks >= 6:
        print("⚠️ Prérequis partiellement satisfaits")
        print("💡 Certaines options de déploiement sont disponibles")
    else:
        print("❌ Prérequis insuffisants")
        print("💡 Installez les outils manquants avant de continuer")
    
    # Afficher les options disponibles
    show_deployment_options()
    
    print("\n📖 DOCUMENTATION:")
    print("   • Guide complet: DEPLOYMENT_GUIDE.md")
    print("   • Guide cloud: deploy_cloud_guide.md")
    print("   • Scripts disponibles: deploy_local.py, build_frontend.py")

if __name__ == "__main__":
    main()
