# Script PowerShell pour créer la base de données PostgreSQL
# Pour BarStock

Write-Host "🗄️ Création de la base de données PostgreSQL pour BarStock" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$DB_NAME = "barstock_db"
$DB_USER = "barstock_user"
$DB_PASSWORD = "barstock123"
$POSTGRES_USER = "postgres"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Base de données: $DB_NAME"
Write-Host "   Utilisateur: $DB_USER"
Write-Host "   Mot de passe: $DB_PASSWORD"
Write-Host ""

# Demander le mot de passe postgres
Write-Host "🔐 Entrez le mot de passe de l'utilisateur 'postgres':" -ForegroundColor Yellow
$POSTGRES_PASSWORD = Read-Host -AsSecureString
$POSTGRES_PASSWORD_TEXT = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($POSTGRES_PASSWORD))

Write-Host ""
Write-Host "🔧 Création de la base de données..." -ForegroundColor Green

# Créer un fichier SQL temporaire
$SQL_FILE = "temp_create_db.sql"
$SQL_CONTENT = @"
-- Créer la base de données
CREATE DATABASE $DB_NAME;

-- Créer l'utilisateur
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Donner les privilèges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Afficher un message de succès
\echo 'Base de données créée avec succès !'
"@

$SQL_CONTENT | Out-File -FilePath $SQL_FILE -Encoding UTF8

# Exécuter le script SQL
$env:PGPASSWORD = $POSTGRES_PASSWORD_TEXT
& psql -U $POSTGRES_USER -f $SQL_FILE

# Nettoyer
Remove-Item $SQL_FILE

Write-Host ""
Write-Host "✅ Base de données créée avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Informations de connexion:" -ForegroundColor Cyan
Write-Host "   Host: localhost"
Write-Host "   Port: 5432"
Write-Host "   Database: $DB_NAME"
Write-Host "   User: $DB_USER"
Write-Host "   Password: $DB_PASSWORD"
Write-Host ""
Write-Host "🔗 URL de connexion:" -ForegroundColor Cyan
Write-Host "   postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Modifier backend/.env avec ces informations"
Write-Host "   2. Exécuter: python manage.py migrate"
Write-Host "   3. Créer un superutilisateur: python manage.py createsuperuser"
Write-Host ""
Write-Host "🎉 Terminé !" -ForegroundColor Green
