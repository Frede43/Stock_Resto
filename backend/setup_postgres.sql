-- Script SQL pour configurer PostgreSQL local pour BarStock
-- À exécuter avec : psql -U postgres -f setup_postgres.sql

-- Créer la base de données si elle n'existe pas
CREATE DATABASE barstock_db;

-- Se connecter à la base de données
\c barstock_db

-- Créer l'utilisateur s'il n'existe pas
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'barstock_user') THEN
      CREATE USER barstock_user WITH PASSWORD 'barstock123';
   END IF;
END
$$;

-- Donner tous les privilèges
GRANT ALL PRIVILEGES ON DATABASE barstock_db TO barstock_user;

-- Donner les privilèges sur le schéma public
GRANT ALL ON SCHEMA public TO barstock_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO barstock_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO barstock_user;

-- Définir les privilèges par défaut pour les futurs objets
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO barstock_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO barstock_user;

-- Afficher les bases de données
\l

-- Afficher les utilisateurs
\du

\echo 'Configuration PostgreSQL terminée !'
\echo 'Base de données: barstock_db'
\echo 'Utilisateur: barstock_user'
\echo 'Mot de passe: barstock123'
