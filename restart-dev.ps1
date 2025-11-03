# Script pour redémarrer le serveur Vite avec cache nettoyé

Write-Host "🧹 Nettoyage du cache Vite..." -ForegroundColor Yellow

# Supprimer le cache Vite
if (Test-Path "node_modules\.vite") {
    Remove-Item -Recurse -Force "node_modules\.vite"
    Write-Host "✅ Cache Vite supprimé" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Pas de cache à supprimer" -ForegroundColor Cyan
}

# Supprimer le cache dist
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "✅ Dossier dist supprimé" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Démarrage du serveur Vite..." -ForegroundColor Yellow
Write-Host ""

# Démarrer le serveur
npm run dev
