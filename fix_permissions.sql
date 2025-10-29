-- Script pour corriger les permissions PostgreSQL
-- Exécuter avec : psql -U postgres -d barstock_db -f fix_permissions.sql

-- Donner tous les privilèges sur la base de données
GRANT ALL PRIVILEGES ON DATABASE barstock_db TO barstock_user;

-- Donner les privilèges sur le schéma public
GRANT ALL ON SCHEMA public TO barstock_user;

-- Donner les privilèges pour créer des objets
GRANT CREATE ON SCHEMA public TO barstock_user;

-- Donner les privilèges sur toutes les tables existantes
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO barstock_user;

-- Donner les privilèges sur toutes les séquences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO barstock_user;

-- Définir les privilèges par défaut pour les futurs objets
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO barstock_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO barstock_user;

-- Afficher un message de succès
\echo 'Permissions accordées avec succès !'
