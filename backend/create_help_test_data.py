#!/usr/bin/env python
"""
Script pour créer des données de test pour le système d'aide
"""
import os
import sys
import django

# Configuration Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from help.models import HelpCategory, FAQ, Tutorial, SupportRequest
from accounts.models import User

def create_help_test_data():
    print("🔄 Création des données de test pour le système d'aide...")
    
    # Créer ou récupérer un utilisateur admin
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@barstock.demo',
            'first_name': 'Admin',
            'last_name': 'System',
            'role': 'admin',
            'is_staff': True,
            'is_superuser': True
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"✅ Utilisateur admin créé: {admin_user.username}")
    
    # Créer les catégories d'aide
    categories_data = [
        {'name': 'Démarrage', 'description': 'Premiers pas avec Bar Stock Wise'},
        {'name': 'Produits', 'description': 'Gestion des produits et inventaire'},
        {'name': 'Ventes', 'description': 'Point de vente et transactions'},
        {'name': 'Stocks', 'description': 'Gestion des stocks et approvisionnements'},
        {'name': 'Rapports', 'description': 'Génération et analyse des rapports'},
        {'name': 'Paramètres', 'description': 'Configuration du système'},
    ]
    
    categories = {}
    for cat_data in categories_data:
        category, created = HelpCategory.objects.get_or_create(
            name=cat_data['name'],
            defaults={'description': cat_data['description']}
        )
        categories[cat_data['name']] = category
        if created:
            print(f"✅ Catégorie créée: {category.name}")
    
    # Créer les FAQ
    faqs_data = [
        {
            'question': 'Comment ajouter un nouveau produit ?',
            'answer': 'Allez dans la section "Produits", cliquez sur "Nouveau produit", remplissez les informations requises (nom, prix, catégorie, stock initial) et sauvegardez.',
            'category': 'Produits',
            'helpful_count': 15,
            'views': 45
        },
        {
            'question': 'Comment effectuer une vente ?',
            'answer': 'Utilisez l\'interface POS dans "Ventes". Sélectionnez la table, ajoutez les produits au panier, choisissez le mode de paiement et finalisez la transaction.',
            'category': 'Ventes',
            'helpful_count': 23,
            'views': 67
        },
        {
            'question': 'Comment gérer les alertes de stock ?',
            'answer': 'Les alertes apparaissent automatiquement quand le stock atteint le seuil minimum. Vous pouvez configurer ces seuils dans les paramètres de chaque produit.',
            'category': 'Stocks',
            'helpful_count': 18,
            'views': 52
        },
        {
            'question': 'Comment générer un rapport ?',
            'answer': 'Allez dans "Rapports", sélectionnez le type de rapport, la période et le format d\'export souhaité, puis cliquez sur "Générer".',
            'category': 'Rapports',
            'helpful_count': 12,
            'views': 34
        },
        {
            'question': 'Comment configurer les utilisateurs ?',
            'answer': 'Dans "Paramètres > Utilisateurs", vous pouvez ajouter de nouveaux utilisateurs, définir leurs rôles (admin, manager, serveur, caissier) et gérer leurs permissions.',
            'category': 'Paramètres',
            'helpful_count': 8,
            'views': 28
        },
        {
            'question': 'Comment faire une sauvegarde des données ?',
            'answer': 'Allez dans "Paramètres > Sauvegarde", choisissez le type de sauvegarde (complète ou partielle) et cliquez sur "Démarrer la sauvegarde".',
            'category': 'Paramètres',
            'helpful_count': 6,
            'views': 19
        },
        {
            'question': 'Comment voir les ventes du jour ?',
            'answer': 'Le tableau de bord principal affiche automatiquement les ventes du jour. Vous pouvez aussi aller dans "Rapports > Ventes quotidiennes" pour plus de détails.',
            'category': 'Ventes',
            'helpful_count': 20,
            'views': 58
        },
        {
            'question': 'Comment ajouter un fournisseur ?',
            'answer': 'Dans "Stocks > Fournisseurs", cliquez sur "Nouveau fournisseur", renseignez les informations de contact et les conditions commerciales.',
            'category': 'Stocks',
            'helpful_count': 11,
            'views': 31
        }
    ]
    
    for faq_data in faqs_data:
        faq, created = FAQ.objects.get_or_create(
            question=faq_data['question'],
            defaults={
                'answer': faq_data['answer'],
                'category': categories[faq_data['category']],
                'helpful_count': faq_data['helpful_count'],
                'views': faq_data['views'],
                'created_by': admin_user
            }
        )
        if created:
            print(f"✅ FAQ créée: {faq.question[:50]}...")
    
    # Créer les tutoriels
    tutorials_data = [
        {
            'title': 'Premiers pas avec Bar Stock Wise',
            'description': 'Introduction complète au système de gestion pour les nouveaux utilisateurs',
            'duration': '15 min',
            'category': 'Démarrage',
            'difficulty': 'beginner',
            'views': 89,
            'video_url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        },
        {
            'title': 'Configuration du point de vente',
            'description': 'Paramétrer l\'interface POS pour votre établissement',
            'duration': '12 min',
            'category': 'Ventes',
            'difficulty': 'intermediate',
            'views': 67,
            'video_url': 'https://www.youtube.com/watch?v=jNQXAC9IVRw'
        },
        {
            'title': 'Gestion avancée des stocks',
            'description': 'Optimiser la gestion des inventaires et approvisionnements',
            'duration': '20 min',
            'category': 'Stocks',
            'difficulty': 'advanced',
            'views': 45,
            'video_url': 'https://www.youtube.com/watch?v=9bZkp7q19f0'
        },
        {
            'title': 'Création de rapports personnalisés',
            'description': 'Générer des analyses adaptées à vos besoins',
            'duration': '18 min',
            'category': 'Rapports',
            'difficulty': 'intermediate',
            'views': 53,
            'video_url': 'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
        },
        {
            'title': 'Configuration des utilisateurs et permissions',
            'description': 'Gérer les accès et rôles dans votre équipe',
            'duration': '10 min',
            'category': 'Paramètres',
            'difficulty': 'intermediate',
            'views': 38,
            'video_url': 'https://www.youtube.com/watch?v=L_jWHffIx5E'
        },
        {
            'title': 'Utilisation du tableau de bord',
            'description': 'Comprendre et utiliser efficacement le tableau de bord principal',
            'duration': '8 min',
            'category': 'Démarrage',
            'difficulty': 'beginner',
            'views': 72,
            'video_url': 'https://www.youtube.com/watch?v=oHg5SJYRHA0'
        }
    ]
    
    for tutorial_data in tutorials_data:
        tutorial, created = Tutorial.objects.get_or_create(
            title=tutorial_data['title'],
            defaults={
                'description': tutorial_data['description'],
                'duration': tutorial_data['duration'],
                'category': categories[tutorial_data['category']],
                'difficulty': tutorial_data['difficulty'],
                'views': tutorial_data['views'],
                'video_url': tutorial_data.get('video_url'),
                'created_by': admin_user
            }
        )
        if created:
            print(f"✅ Tutoriel créé: {tutorial.title}")
    
    # Créer quelques demandes de support d'exemple
    support_requests_data = [
        {
            'subject': 'Problème de connexion',
            'message': 'Je n\'arrive pas à me connecter avec mes identifiants habituels.',
            'category': 'technique',
            'priority': 'high'
        },
        {
            'subject': 'Question sur les rapports',
            'message': 'Comment puis-je exporter les rapports en format Excel ?',
            'category': 'fonctionnel',
            'priority': 'medium'
        }
    ]
    
    for req_data in support_requests_data:
        support_request, created = SupportRequest.objects.get_or_create(
            subject=req_data['subject'],
            defaults={
                'message': req_data['message'],
                'category': req_data['category'],
                'priority': req_data['priority'],
                'created_by': admin_user
            }
        )
        if created:
            print(f"✅ Demande de support créée: {support_request.subject}")
    
    print("\n🎉 Données de test créées avec succès !")
    print(f"📊 Statistiques:")
    print(f"   - {HelpCategory.objects.count()} catégories")
    print(f"   - {FAQ.objects.count()} FAQ")
    print(f"   - {Tutorial.objects.count()} tutoriels")
    print(f"   - {SupportRequest.objects.count()} demandes de support")

if __name__ == '__main__':
    create_help_test_data()
