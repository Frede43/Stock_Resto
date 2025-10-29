from django.contrib import admin
from .models import Ingredient, IngredientMovement, Recipe, RecipeIngredient, IngredientSubstitution


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = [
        'nom', 'quantite_restante', 'unite', 'prix_unitaire', 'seuil_alerte', 
        'is_low_stock', 'stock_value', 'is_active', 'date_maj'
    ]
    list_filter = ['unite', 'is_active']
    search_fields = ['nom', 'description']
    readonly_fields = ['date_maj', 'created_at', 'is_low_stock', 'is_out_of_stock', 'stock_value']
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('nom', 'description', 'unite', 'is_active')
        }),
        ('Stock', {
            'fields': ('quantite_restante', 'seuil_alerte', 'is_low_stock', 'is_out_of_stock')
        }),
        ('Prix', {
            'fields': ('prix_unitaire', 'stock_value')
        }),
        ('Fournisseur', {
            'fields': ('fournisseur',)
        }),
        ('Dates', {
            'fields': ('date_maj', 'created_at'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('fournisseur')


@admin.register(IngredientMovement)
class IngredientMovementAdmin(admin.ModelAdmin):
    list_display = [
        'ingredient', 'movement_type', 'reason', 'quantity', 
        'stock_before', 'stock_after', 'user', 'created_at'
    ]
    list_filter = ['movement_type', 'reason', 'created_at']
    search_fields = ['ingredient__nom', 'notes', 'reference']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Mouvement', {
            'fields': ('ingredient', 'movement_type', 'reason', 'quantity')
        }),
        ('Stock', {
            'fields': ('stock_before', 'stock_after')
        }),
        ('Prix', {
            'fields': ('unit_price', 'total_amount')
        }),
        ('Informations', {
            'fields': ('user', 'supplier', 'reference', 'notes')
        }),
        ('Date', {
            'fields': ('created_at',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('ingredient', 'user', 'supplier')


class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 1
    fields = ['ingredient', 'quantite_utilisee_par_plat', 'unite', 'is_optional', 'notes']
    readonly_fields = ['cost_per_portion', 'is_available']


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = [
        'nom_recette', 'plat', 'portions', 'temps_preparation', 
        'total_cost', 'can_be_prepared', 'is_active'
    ]
    list_filter = ['is_active', 'portions']
    search_fields = ['nom_recette', 'plat__name', 'description']
    readonly_fields = ['total_cost', 'can_be_prepared', 'created_at', 'updated_at']
    inlines = [RecipeIngredientInline]
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('plat', 'nom_recette', 'description', 'is_active')
        }),
        ('Préparation', {
            'fields': ('instructions', 'temps_preparation', 'portions')
        }),
        ('Coûts et disponibilité', {
            'fields': ('total_cost', 'can_be_prepared')
        }),
        ('Utilisateur et dates', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('plat', 'created_by').prefetch_related('ingredients__ingredient')

    def save_model(self, request, obj, form, change):
        if not change:  # Si c'est une nouvelle recette
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(RecipeIngredient)
class RecipeIngredientAdmin(admin.ModelAdmin):
    list_display = [
        'recipe', 'ingredient', 'quantite_utilisee_par_plat', 
        'unite', 'cost_per_portion', 'is_available', 'is_optional'
    ]
    list_filter = ['unite', 'is_optional']
    search_fields = ['recipe__nom_recette', 'ingredient__nom']
    readonly_fields = ['cost_per_portion', 'is_available', 'created_at']
    
    fieldsets = (
        ('Recette et ingrédient', {
            'fields': ('recipe', 'ingredient')
        }),
        ('Quantité', {
            'fields': ('quantite_utilisee_par_plat', 'unite')
        }),
        ('Options', {
            'fields': ('is_optional', 'notes')
        }),
        ('Coût et disponibilité', {
            'fields': ('cost_per_portion', 'is_available')
        }),
        ('Date', {
            'fields': ('created_at',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('recipe', 'ingredient')


@admin.register(IngredientSubstitution)
class IngredientSubstitutionAdmin(admin.ModelAdmin):
    list_display = [
        'original_ingredient', 'substitute_ingredient', 'conversion_ratio',
        'priority', 'is_active', 'created_at'
    ]
    list_filter = ['is_active', 'priority', 'created_at']
    search_fields = ['original_ingredient__nom', 'substitute_ingredient__nom', 'notes']
    readonly_fields = ['created_at']

    fieldsets = (
        ('Substitution', {
            'fields': ('original_ingredient', 'substitute_ingredient')
        }),
        ('Configuration', {
            'fields': ('conversion_ratio', 'priority', 'is_active')
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Date', {
            'fields': ('created_at',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('original_ingredient', 'substitute_ingredient')
