
// 🧹 Script de nettoyage du cache frontend
// À exécuter dans la console du navigateur

console.log("🧹 NETTOYAGE CACHE FRONTEND");
console.log("=" * 35);

// 1. Vérifier les données actuelles
console.log("📊 DONNÉES ACTUELLES:");
const currentUser = localStorage.getItem('user');
if (currentUser) {
    const userData = JSON.parse(currentUser);
    console.log("   User data:", userData);
    console.log("   Rôle actuel:", userData.role);
} else {
    console.log("   Aucune donnée utilisateur en cache");
}

// 2. Nettoyer le localStorage
console.log("\n🗑️ NETTOYAGE LOCALSTORAGE:");
localStorage.removeItem('user');
localStorage.removeItem('token');
localStorage.removeItem('refreshToken');
console.log("✅ Cache utilisateur supprimé");

// 3. Nettoyer le sessionStorage
console.log("\n🗑️ NETTOYAGE SESSIONSTORAGE:");
sessionStorage.clear();
console.log("✅ Session storage vidé");

// 4. Recharger la page
console.log("\n🔄 RECHARGEMENT PAGE:");
console.log("✅ Redirection vers /login");
window.location.href = '/login';
