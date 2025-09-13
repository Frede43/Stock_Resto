#!/usr/bin/env python
import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from kitchen.views import kitchen_dashboard
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from kitchen.models import Ingredient, Recipe
import traceback

User = get_user_model()

def test_kitchen_dashboard():
    print("=== Test Kitchen Dashboard ===")
    
    # Créer une requête factice
    factory = RequestFactory()
    request = factory.get('/api/kitchen/dashboard/')
    
    # Créer un utilisateur factice
    user = User.objects.first()
    if not user:
        user = User.objects.create_user('test', 'test@test.com', 'test')
    request.user = user
    
    # Tester la vue
    try:
        response = kitchen_dashboard(request)
        print("SUCCESS: Kitchen dashboard works")
        print("Response data:", response.data)
        return True
    except Exception as e:
        print("ERROR:", str(e))
        traceback.print_exc()
        return False

def test_models():
    print("\n=== Test Models ===")
    
    try:
        # Test Ingredient model
        ingredient_count = Ingredient.objects.count()
        print(f"Ingredients count: {ingredient_count}")
        
        # Test Recipe model
        recipe_count = Recipe.objects.count()
        print(f"Recipes count: {recipe_count}")
        
        # Test if we have any ingredients
        if ingredient_count > 0:
            ingredient = Ingredient.objects.first()
            print(f"First ingredient: {ingredient}")
        
        return True
    except Exception as e:
        print("ERROR in models:", str(e))
        traceback.print_exc()
        return False

def check_database_tables():
    print("\n=== Check Database Tables ===")
    
    from django.db import connection
    
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'kitchen_%';")
            tables = cursor.fetchall()
            print("Kitchen tables:", [table[0] for table in tables])
            
            # Check if tables have data
            for table in tables:
                table_name = table[0]
                cursor.execute(f"SELECT COUNT(*) FROM {table_name};")
                count = cursor.fetchone()[0]
                print(f"  {table_name}: {count} rows")
        
        return True
    except Exception as e:
        print("ERROR checking tables:", str(e))
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Testing Kitchen API...")
    
    # Test database tables first
    check_database_tables()
    
    # Test models
    test_models()
    
    # Test dashboard view
    test_kitchen_dashboard()
    
    print("\nTest completed.")
