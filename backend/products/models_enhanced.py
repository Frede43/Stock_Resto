"""
Modèles améliorés pour l'architecture à deux niveaux :
- Niveau Commercial (Sales) : Produits finis avec prix
- Niveau Technique (Kitchen) : Ingrédients et recettes
"""

from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class IngredientCategory(models.Model):
    """Catégories d'ingrédients pour la cuisine"""
    
    INGREDIENT_TYPES = [
        ('proteins', 'Protéines'),
        ('vegetables', 'Légumes'),
        ('grains', 'Céréales'),
        ('dairy', 'Produits laitiers'),
        ('spices', 'Épices'),
        ('beverages_base', 'Base boissons'),
        ('alcohol', 'Alcool'),
        ('condiments', 'Condiments'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=20, choices=INGREDIENT_TYPES)
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Catégorie d\'ingrédient'
        verbose_name_plural = 'Catégories d\'ingrédients'
    
    def __str__(self):
        return self.name


class Ingredient(models.Model):
    """Ingrédients bruts pour les recettes (Niveau Technique)"""
    
    UNIT_CHOICES = [
        ('kg', 'Kilogrammes'),
        ('g', 'Grammes'),
        ('l', 'Litres'),
        ('ml', 'Millilitres'),
        ('pieces', 'Pièces'),
        ('cups', 'Tasses'),
        ('tbsp', 'Cuillères à soupe'),
        ('tsp', 'Cuillères à café'),
    ]
    
    name = models.CharField(max_length=200, unique=True)
    category = models.ForeignKey(IngredientCategory, on_delete=models.CASCADE)
    
    # Stock et unités
    current_stock = models.DecimalField(
        max_digits=10, 
        decimal_places=3, 
        default=0,
        validators=[MinValueValidator(Decimal('0'))]
    )
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES)
    minimum_stock = models.DecimalField(
        max_digits=10, 
        decimal_places=3, 
        default=0
    )
    
    # Coûts
    cost_per_unit = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        help_text="Coût par unité en BIF"
    )
    
    # Informations fournisseur
    supplier = models.ForeignKey(
        'suppliers.Supplier', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='product_ingredients'
    )
    
    # Métadonnées
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Ingrédient'
        verbose_name_plural = 'Ingrédients'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.current_stock} {self.unit})"
    
    @property
    def is_low_stock(self):
        """Vérifie si le stock est faible"""
        return self.current_stock <= self.minimum_stock
    
    @property
    def stock_value(self):
        """Valeur du stock actuel"""
        return self.current_stock * self.cost_per_unit


class MenuCategory(models.Model):
    """Catégories pour le menu commercial"""
    
    MENU_TYPES = [
        ('beverages', 'Boissons'),
        ('hot_drinks', 'Boissons chaudes'),
        ('cocktails', 'Cocktails'),
        ('appetizers', 'Entrées'),
        ('main_courses', 'Plats principaux'),
        ('desserts', 'Desserts'),
        ('snacks', 'Snacks'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=20, choices=MENU_TYPES)
    description = models.TextField(blank=True, null=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name = 'Catégorie de menu'
        verbose_name_plural = 'Catégories de menu'
        ordering = ['display_order', 'name']
    
    def __str__(self):
        return self.name


class Recipe(models.Model):
    """Recettes techniques (Niveau Kitchen)"""
    
    DIFFICULTY_LEVELS = [
        ('easy', 'Facile'),
        ('medium', 'Moyen'),
        ('hard', 'Difficile'),
    ]
    
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True, null=True)
    instructions = models.TextField(help_text="Instructions de préparation")
    
    # Temps et difficulté
    prep_time = models.PositiveIntegerField(
        help_text="Temps de préparation en minutes"
    )
    cook_time = models.PositiveIntegerField(
        default=0,
        help_text="Temps de cuisson en minutes"
    )
    difficulty = models.CharField(
        max_length=10, 
        choices=DIFFICULTY_LEVELS, 
        default='medium'
    )
    
    # Portions et coûts
    portions = models.PositiveIntegerField(
        default=1,
        help_text="Nombre de portions produites"
    )
    
    # Métadonnées
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Recette'
        verbose_name_plural = 'Recettes'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.portions} portions)"
    
    @property
    def total_time(self):
        """Temps total de préparation"""
        return self.prep_time + self.cook_time
    
    @property
    def cost_price(self):
        """Calcule le coût de revient de la recette"""
        total_cost = Decimal('0')
        for ingredient_recipe in self.recipe_ingredients.all():
            ingredient_cost = (
                ingredient_recipe.quantity * 
                ingredient_recipe.ingredient.cost_per_unit
            )
            total_cost += ingredient_cost
        return total_cost
    
    @property
    def cost_per_portion(self):
        """Coût par portion"""
        if self.portions > 0:
            return self.cost_price / self.portions
        return Decimal('0')

    def max_portions_possible(self):
        """Calcule le nombre maximum de portions possibles avec le stock actuel"""
        if not self.recipe_ingredients.exists():
            return 0

        min_portions = float('inf')
        for recipe_ingredient in self.recipe_ingredients.all():
            ingredient = recipe_ingredient.ingredient
            required_quantity = recipe_ingredient.quantity

            if required_quantity > 0:
                possible_portions = int(ingredient.current_stock / required_quantity)
                min_portions = min(min_portions, possible_portions)

        return int(min_portions) if min_portions != float('inf') else 0

    def can_be_prepared(self, quantity=1):
        """Vérifie si la recette peut être préparée avec le stock actuel"""
        return self.max_portions_possible() >= quantity


class RecipeIngredient(models.Model):
    """Ingrédients nécessaires pour une recette"""
    
    recipe = models.ForeignKey(
        Recipe, 
        on_delete=models.CASCADE, 
        related_name='recipe_ingredients'
    )
    ingredient = models.ForeignKey(
        Ingredient, 
        on_delete=models.CASCADE
    )
    quantity = models.DecimalField(
        max_digits=10, 
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.001'))]
    )
    unit = models.CharField(max_length=10)  # Doit correspondre à l'unité de l'ingrédient
    notes = models.CharField(max_length=200, blank=True, null=True)
    
    class Meta:
        verbose_name = 'Ingrédient de recette'
        verbose_name_plural = 'Ingrédients de recette'
        unique_together = ['recipe', 'ingredient']
    
    def __str__(self):
        return f"{self.recipe.name}: {self.quantity} {self.unit} de {self.ingredient.name}"
    
    @property
    def cost(self):
        """Coût de cet ingrédient dans la recette"""
        return self.quantity * self.ingredient.cost_per_unit


class MenuItem(models.Model):
    """Produits du menu commercial (Niveau Sales)"""
    
    ITEM_TYPES = [
        ('simple', 'Produit simple'),  # Boissons en bouteille
        ('recipe', 'Basé sur recette'),  # Plats cuisinés
        ('combo', 'Menu combo'),  # Combinaisons
    ]
    
    name = models.CharField(max_length=200, unique=True)
    category = models.ForeignKey(MenuCategory, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=ITEM_TYPES)
    
    # Prix commercial
    selling_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # Lien vers recette (si applicable)
    recipe = models.ForeignKey(
        Recipe, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Recette associée (pour les plats cuisinés)"
    )
    
    # Stock direct (pour les produits simples)
    direct_stock = models.DecimalField(
        max_digits=10, 
        decimal_places=3, 
        default=0,
        help_text="Stock direct (pour boissons, snacks...)"
    )
    
    # Informations commerciales
    description = models.TextField(blank=True, null=True)
    image = models.ImageField(upload_to='menu_items/', blank=True, null=True)
    is_available = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Métadonnées
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Article du menu'
        verbose_name_plural = 'Articles du menu'
        ordering = ['category__display_order', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.selling_price} BIF"
    
    @property
    def cost_price(self):
        """Coût de revient"""
        if self.recipe:
            return self.recipe.cost_per_portion
        return Decimal('0')  # Pour les produits simples, à définir manuellement
    
    @property
    def margin(self):
        """Marge bénéficiaire"""
        return self.selling_price - self.cost_price
    
    @property
    def margin_percentage(self):
        """Pourcentage de marge"""
        if self.selling_price > 0:
            return (self.margin / self.selling_price) * 100
        return 0
    
    @property
    def available_quantity(self):
        """Quantité disponible (basée sur stock ou ingrédients)"""
        if self.type == 'simple':
            return int(self.direct_stock)
        elif self.recipe:
            return self.recipe.max_portions_possible()
        return 0
    
    @property
    def is_in_stock(self):
        """Vérifie si l'article est en stock"""
        return self.available_quantity > 0 and self.is_available
