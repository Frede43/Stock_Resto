from django.db import models, transaction
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.conf import settings
from django.core.exceptions import ValidationError


class Ingredient(models.Model):
    """
    Modèle pour les ingrédients de cuisine
    Correspond au Stock Cuisine du cahier des charges
    """

    UNIT_CHOICES = [
        ('kg', 'Kilogramme'),
        ('g', 'Gramme'),
        ('L', 'Litre'),
        ('ml', 'Millilitre'),
        ('piece', 'Pièce'),
        ('portion', 'Portion'),
    ]

    nom = models.CharField(
        max_length=200,
        verbose_name='Nom de l\'ingrédient'
    )

    quantite_restante = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.000'))],
        default=Decimal('0.000'),
        verbose_name='Quantité restante'
    )
    

    unite = models.CharField(
        max_length=10,
        choices=UNIT_CHOICES,
        default='kg',
        verbose_name='Unité de mesure'
    )

    seuil_alerte = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.000'))],
        default=Decimal('1.000'),
        verbose_name='Seuil d\'alerte'
    )

    # Prix pour le calcul des coûts
    prix_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        default=Decimal('0.00'),
        verbose_name='Prix unitaire (BIF)'
    )

    # Informations supplémentaires
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Description'
    )

    fournisseur = models.ForeignKey(
        'suppliers.Supplier',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='kitchen_ingredients',
        verbose_name='Fournisseur principal'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Ingrédient actif'
    )

    date_maj = models.DateTimeField(
        auto_now=True,
        verbose_name='Date de mise à jour'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )

    class Meta:
        verbose_name = 'Ingrédient'
        verbose_name_plural = 'Ingrédients'
        ordering = ['nom']

    def __str__(self):
        return f"{self.nom} ({self.quantite_restante} {self.unite})"

    @property
    def is_low_stock(self):
        """Vérifie si l'ingrédient est en dessous du seuil d'alerte"""
        return self.quantite_restante <= self.seuil_alerte

    @property
    def is_out_of_stock(self):
        """Vérifie si l'ingrédient est en rupture"""
        return self.quantite_restante <= 0

    @property
    def stock_value(self):
        """Calcule la valeur du stock"""
        return self.quantite_restante * self.prix_unitaire

    def can_fulfill_quantity(self, quantity_needed):
        """Vérifie si on peut satisfaire une quantité demandée"""
        return self.quantite_restante >= quantity_needed

    def consume(self, quantity, user=None, notes=None):
        """
        Consomme une quantité d'ingrédient
        Crée un mouvement de stock pour traçabilité
        """
        if not self.can_fulfill_quantity(quantity):
            raise ValueError(f"Stock insuffisant pour {self.nom}. "
                           f"Disponible: {self.quantite_restante}, demandé: {quantity}")

        # Sauvegarder l'ancien stock
        old_stock = self.quantite_restante

        # Décompter
        self.quantite_restante -= quantity
        self.save()

        # Créer un mouvement de stock pour traçabilité
        IngredientMovement.objects.create(
            ingredient=self,
            movement_type='out',
            reason='consumption',
            quantity=quantity,
            stock_before=old_stock,
            stock_after=self.quantite_restante,
            user=user,
            notes=notes or f"Consommation pour recette"
        )

        return self.quantite_restante


class IngredientMovement(models.Model):
    """
    Modèle pour tracer tous les mouvements d'ingrédients
    """

    MOVEMENT_TYPES = [
        ('in', 'Entrée'),
        ('out', 'Sortie'),
        ('adjustment', 'Ajustement'),
        ('loss', 'Perte'),
        ('return', 'Retour'),
    ]

    REASONS = [
        ('purchase', 'Achat'),
        ('consumption', 'Consommation'),
        ('inventory', 'Inventaire'),
        ('damage', 'Dommage'),
        ('expiry', 'Expiration'),
        ('theft', 'Vol'),
        ('correction', 'Correction'),
    ]

    ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.CASCADE,
        related_name='movements',
        verbose_name='Ingrédient'
    )

    movement_type = models.CharField(
        max_length=20,
        choices=MOVEMENT_TYPES,
        verbose_name='Type de mouvement'
    )

    reason = models.CharField(
        max_length=20,
        choices=REASONS,
        verbose_name='Raison'
    )

    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.000'))],
        verbose_name='Quantité'
    )

    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        blank=True,
        null=True,
        verbose_name='Prix unitaire (BIF)'
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        blank=True,
        null=True,
        verbose_name='Montant total (BIF)'
    )

    stock_before = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        verbose_name='Stock avant'
    )

    stock_after = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        verbose_name='Stock après'
    )

    supplier = models.ForeignKey(
        'suppliers.Supplier',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        verbose_name='Fournisseur'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name='Utilisateur'
    )

    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notes'
    )

    reference = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name='Référence'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )

    class Meta:
        verbose_name = 'Mouvement d\'ingrédient'
        verbose_name_plural = 'Mouvements d\'ingrédients'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.ingredient.nom} - {self.get_movement_type_display()} - {self.quantity}"

    def save(self, *args, **kwargs):
        # Calculer le montant total si prix unitaire fourni
        if self.unit_price and not self.total_amount:
            self.total_amount = self.unit_price * self.quantity
        super().save(*args, **kwargs)


class Recipe(models.Model):
    """
    Modèle pour les recettes des plats
    Lie un produit (plat) à ses ingrédients
    """

    plat = models.OneToOneField(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='recipe',
        verbose_name='Plat'
    )

    nom_recette = models.CharField(
        max_length=200,
        verbose_name='Nom de la recette'
    )

    description = models.TextField(
        blank=True,
        null=True,
        verbose_name='Description de la recette'
    )

    instructions = models.TextField(
        blank=True,
        null=True,
        verbose_name='Instructions de préparation'
    )

    temps_preparation = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name='Temps de préparation (minutes)'
    )

    portions = models.PositiveIntegerField(
        default=1,
        verbose_name='Nombre de portions'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Recette active'
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name='Créé par'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='Date de modification'
    )

    class Meta:
        verbose_name = 'Recette'
        verbose_name_plural = 'Recettes'
        ordering = ['nom_recette']

    def __str__(self):
        return f"Recette: {self.nom_recette}"

    @property
    def total_cost(self):
        """Calcule le coût total de la recette"""
        total = Decimal('0.00')
        for ingredient_recipe in self.ingredients.all():
            ingredient_cost = (ingredient_recipe.quantite_utilisee_par_plat *
                             ingredient_recipe.ingredient.prix_unitaire)
            total += ingredient_cost
        return total

    @property
    def can_be_prepared(self):
        """Vérifie si la recette peut être préparée avec le stock actuel"""
        for ingredient_recipe in self.ingredients.all():
            if not ingredient_recipe.ingredient.can_fulfill_quantity(
                ingredient_recipe.quantite_utilisee_par_plat
            ):
                return False
        return True

    def max_portions_available(self):
        """Calcule le nombre maximum de portions possibles avec le stock actuel"""
        if not self.ingredients.exists():
            return 0

        min_portions = float('inf')
        for ingredient_recipe in self.ingredients.all():
            ingredient = ingredient_recipe.ingredient
            required_quantity = ingredient_recipe.quantite_utilisee_par_plat
            available_quantity = ingredient.quantite_restante

            if required_quantity > 0:
                possible_portions = int(available_quantity / required_quantity)
                min_portions = min(min_portions, possible_portions)

        return int(min_portions) if min_portions != float('inf') else 0

    def consume_ingredients(self, quantity=1, user=None):
        """
        Décompte les ingrédients lors de la préparation/vente
        """
        from django.db import transaction
        from .models import StockMovement

        if not self.can_be_prepared:
            raise ValueError(f"Impossible de préparer {self.nom_recette}: ingrédients insuffisants")

        with transaction.atomic():
            for ingredient_recipe in self.ingredients.all():
                ingredient = ingredient_recipe.ingredient
                quantity_needed = ingredient_recipe.quantite_utilisee_par_plat * quantity

                if ingredient.quantite_restante < quantity_needed:
                    raise ValueError(f"Stock insuffisant pour {ingredient.nom}: {ingredient.quantite_restante} < {quantity_needed}")

                # Décompter le stock
                old_stock = ingredient.quantite_restante
                ingredient.quantite_restante -= quantity_needed
                ingredient.save()

                # Enregistrer le mouvement de stock
                StockMovement.objects.create(
                    ingredient=ingredient,
                    type='sortie',
                    quantity=quantity_needed,
                    reason=f'Préparation {self.nom_recette} (x{quantity})',
                    user=user,
                    stock_before=old_stock,
                    stock_after=ingredient.quantite_restante
                )

    def get_missing_ingredients(self):
        """Retourne la liste des ingrédients manquants"""
        missing = []
        for ingredient_recipe in self.ingredients.all():
            ingredient = ingredient_recipe.ingredient
            needed = ingredient_recipe.quantite_utilisee_par_plat
            available = ingredient.quantite_restante

            if available < needed:
                missing.append({
                    'ingredient': ingredient,
                    'needed': needed,
                    'available': available,
                    'shortage': needed - available
                })
        return missing

    @transaction.atomic
    def consume_ingredients(self, quantity=1, user=None):
        """
        Consomme les ingrédients pour préparer la recette avec gestion transactionnelle
        quantity: nombre de portions à préparer

        🔒 TRANSACTION ATOMIQUE: Soit tous les ingrédients sont décomptés, soit aucun
        """
        # 1. VALIDATION GLOBALE PRÉALABLE
        validation_result = self.validate_ingredients_availability(quantity)
        if not validation_result['can_prepare']:
            raise ValidationError({
                'message': f"Impossible de préparer {quantity}x {self.nom_recette}",
                'missing_ingredients': validation_result['missing_ingredients'],
                'total_ingredients': validation_result['total_ingredients'],
                'available_ingredients': validation_result['available_ingredients']
            })

        consumed_ingredients = []

        # 2. DÉCOMPTE TRANSACTIONNEL
        # Si une erreur survient, Django annulera automatiquement toute la transaction
        try:
            # Créer un point de sauvegarde pour rollback manuel si nécessaire
            savepoint = transaction.savepoint()

            for ingredient_recipe in self.ingredients.select_for_update().all():
                total_needed = ingredient_recipe.quantite_utilisee_par_plat * quantity

                # Vérification finale avant décompte (double sécurité)
                ingredient = ingredient_recipe.ingredient
                if not ingredient.can_fulfill_quantity(total_needed):
                    raise ValidationError(
                        f"Stock insuffisant pour {ingredient.nom}: "
                        f"besoin {total_needed} {ingredient.unite}, "
                        f"disponible {ingredient.quantite_restante} {ingredient.unite}"
                    )

                # Décompter l'ingrédient
                ingredient.consume(
                    quantity=total_needed,
                    user=user,
                    notes=f"Préparation de {quantity}x {self.nom_recette}"
                )

                consumed_ingredients.append({
                    'ingredient': ingredient,
                    'quantity_consumed': total_needed,
                    'stock_before': ingredient.quantite_restante + total_needed,
                    'stock_after': ingredient.quantite_restante
                })

            # Si on arrive ici, tout s'est bien passé
            transaction.savepoint_commit(savepoint)

        except Exception as e:
            # Rollback automatique par Django + log de l'erreur
            transaction.savepoint_rollback(savepoint)

            # Log détaillé pour debug
            error_msg = f"Erreur lors de la consommation des ingrédients pour {self.nom_recette}: {str(e)}"
            print(f"🚨 {error_msg}")

            # Re-lever l'exception avec plus de contexte
            raise ValidationError({
                'message': error_msg,
                'recipe': self.nom_recette,
                'quantity_requested': quantity,
                'ingredients_processed': len(consumed_ingredients),
                'total_ingredients': self.ingredients.count(),
                'original_error': str(e)
            })

        return consumed_ingredients

    def validate_ingredients_availability(self, quantity=1, use_substitutions=True):
        """
        Validation complète de la disponibilité des ingrédients AVANT décompte
        Inclut la gestion des substitutions automatiques
        """
        missing_ingredients = []
        available_ingredients = []
        substitutions_used = []
        total_ingredients = self.ingredients.count()

        for ingredient_recipe in self.ingredients.all():
            ingredient = ingredient_recipe.ingredient
            needed_quantity = ingredient_recipe.quantite_utilisee_par_plat * quantity
            available_quantity = ingredient.quantite_restante

            ingredient_info = {
                'name': ingredient.nom,
                'needed': float(needed_quantity),
                'available': float(available_quantity),
                'unit': ingredient.unite,
                'is_optional': ingredient_recipe.is_optional
            }

            if ingredient.can_fulfill_quantity(needed_quantity):
                # Ingrédient disponible en quantité suffisante
                ingredient_info['status'] = 'available'
                available_ingredients.append(ingredient_info)

            elif ingredient_recipe.is_optional:
                # Ingrédient optionnel manquant (on peut continuer)
                ingredient_info['status'] = 'optional_missing'
                available_ingredients.append(ingredient_info)

            else:
                # Ingrédient obligatoire manquant - chercher des substitutions
                substitution_found = False

                if use_substitutions:
                    # Chercher des substitutions disponibles par ordre de priorité
                    substitutions = ingredient.substitutions.filter(
                        is_active=True
                    ).order_by('priority')

                    for substitution in substitutions:
                        substitute = substitution.substitute_ingredient
                        needed_substitute = needed_quantity * substitution.conversion_ratio

                        if substitute.can_fulfill_quantity(needed_substitute):
                            # Substitution trouvée et disponible
                            substitution_info = {
                                'original_ingredient': ingredient.nom,
                                'substitute_ingredient': substitute.nom,
                                'original_needed': float(needed_quantity),
                                'substitute_needed': float(needed_substitute),
                                'conversion_ratio': float(substitution.conversion_ratio),
                                'substitute_available': float(substitute.quantite_restante),
                                'unit': substitute.unite,
                                'priority': substitution.priority,
                                'notes': substitution.notes
                            }

                            substitutions_used.append(substitution_info)

                            # Ajouter comme disponible avec substitution
                            ingredient_info['status'] = 'available_with_substitution'
                            ingredient_info['substitution'] = substitution_info
                            available_ingredients.append(ingredient_info)

                            substitution_found = True
                            break

                if not substitution_found:
                    # Aucune substitution trouvée - ingrédient vraiment manquant
                    ingredient_info['shortage'] = float(needed_quantity - available_quantity)
                    ingredient_info['status'] = 'missing'

                    # Lister les substitutions possibles mais indisponibles
                    possible_substitutions = []
                    for substitution in ingredient.substitutions.filter(is_active=True):
                        substitute = substitution.substitute_ingredient
                        needed_substitute = needed_quantity * substitution.conversion_ratio
                        possible_substitutions.append({
                            'substitute_name': substitute.nom,
                            'needed': float(needed_substitute),
                            'available': float(substitute.quantite_restante),
                            'shortage': float(needed_substitute - substitute.quantite_restante),
                            'conversion_ratio': float(substitution.conversion_ratio)
                        })

                    ingredient_info['possible_substitutions'] = possible_substitutions
                    missing_ingredients.append(ingredient_info)

        can_prepare = len(missing_ingredients) == 0

        return {
            'can_prepare': can_prepare,
            'total_ingredients': total_ingredients,
            'available_ingredients': available_ingredients,
            'missing_ingredients': missing_ingredients,
            'substitutions_used': substitutions_used,
            'missing_count': len(missing_ingredients),
            'available_count': len(available_ingredients),
            'substitutions_count': len(substitutions_used)
        }

    def update_product_purchase_price(self):
        """
        Met à jour automatiquement le prix d'achat du produit lié
        basé sur le coût total des ingrédients de la recette

        Exemple: Riz au Poulet
        - Riz: 300 FBU + Poulet: 2000 FBU + Huile: 200 FBU + Épices: 500 FBU = 3000 FBU
        - Le produit "Riz au Poulet" aura automatiquement purchase_price = 3000 FBU
        """
        if self.plat:
            total_cost = self.total_cost
            self.plat.purchase_price = total_cost
            self.plat.save(update_fields=['purchase_price'])

            return {
                'product_name': self.plat.name,
                'old_purchase_price': self.plat.purchase_price,
                'new_purchase_price': total_cost,
                'ingredients_cost_detail': [
                    {
                        'ingredient': ing.ingredient.nom,
                        'quantity': ing.quantite_utilisee_par_plat,
                        'unit_price': ing.ingredient.prix_unitaire,
                        'total_cost': ing.quantite_utilisee_par_plat * ing.ingredient.prix_unitaire
                    }
                    for ing in self.ingredients.all()
                ]
            }
        return None

    def save(self, *args, **kwargs):
        """
        Surcharge save pour mettre à jour automatiquement le prix d'achat du produit
        """
        super().save(*args, **kwargs)
        # Mettre à jour le prix d'achat du produit après sauvegarde
        self.update_product_purchase_price()


class RecipeIngredient(models.Model):
    """
    Modèle pour la composition des recettes
    Correspond à la table de liaison plat_id | ingredient_id | quantite_utilisee_par_plat
    """

    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='ingredients',
        verbose_name='Recette'
    )

    ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.CASCADE,
        related_name='used_in_recipes',
        verbose_name='Ingrédient'
    )

    quantite_utilisee_par_plat = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        validators=[MinValueValidator(Decimal('0.001'))],
        verbose_name='Quantité utilisée par plat'
    )

    unite = models.CharField(
        max_length=10,
        choices=Ingredient.UNIT_CHOICES,
        verbose_name='Unité de mesure'
    )

    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notes spéciales'
    )

    is_optional = models.BooleanField(
        default=False,
        verbose_name='Ingrédient optionnel'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )

    class Meta:
        verbose_name = 'Ingrédient de recette'
        verbose_name_plural = 'Ingrédients de recette'
        unique_together = ['recipe', 'ingredient']
        ordering = ['recipe', 'ingredient__nom']

    def __str__(self):
        return f"{self.recipe.nom_recette} - {self.ingredient.nom} ({self.quantite_utilisee_par_plat} {self.unite})"

    @property
    def cost_per_portion(self):
        """Calcule le coût de cet ingrédient pour une portion"""
        return self.quantite_utilisee_par_plat * self.ingredient.prix_unitaire

    @property
    def is_available(self):
        """Vérifie si l'ingrédient est disponible en quantité suffisante"""
        return self.ingredient.can_fulfill_quantity(self.quantite_utilisee_par_plat)

    def clean(self):
        """Validation personnalisée"""
        from django.core.exceptions import ValidationError

        # Vérifier que l'unité correspond à celle de l'ingrédient
        if self.unite != self.ingredient.unite:
            raise ValidationError(
                f"L'unité doit correspondre à celle de l'ingrédient ({self.ingredient.unite})"
            )

    def save(self, *args, **kwargs):
        # Validation avant sauvegarde
        self.clean()
        super().save(*args, **kwargs)

        # Mettre à jour automatiquement le prix d'achat du produit lié
        # après modification des ingrédients
        if self.recipe:
            self.recipe.update_product_purchase_price()

    def delete(self, *args, **kwargs):
        """
        Surcharge delete pour mettre à jour le prix d'achat après suppression
        """
        recipe = self.recipe
        super().delete(*args, **kwargs)

        # Mettre à jour le prix d'achat après suppression de l'ingrédient
        if recipe:
            recipe.update_product_purchase_price()


class IngredientSubstitution(models.Model):
    """
    Modèle pour gérer les ingrédients de substitution
    Permet de définir des alternatives en cas de rupture
    """

    original_ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.CASCADE,
        related_name='substitutions',
        verbose_name='Ingrédient original'
    )

    substitute_ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.CASCADE,
        related_name='substitute_for',
        verbose_name='Ingrédient de substitution'
    )

    conversion_ratio = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        default=Decimal('1.000'),
        validators=[MinValueValidator(Decimal('0.001'))],
        verbose_name='Ratio de conversion',
        help_text='Quantité de substitut nécessaire pour 1 unité d\'original'
    )

    priority = models.PositiveIntegerField(
        default=1,
        verbose_name='Priorité',
        help_text='1 = priorité la plus haute'
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name='Substitution active'
    )

    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notes sur la substitution'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )

    class Meta:
        verbose_name = 'Substitution d\'ingrédient'
        verbose_name_plural = 'Substitutions d\'ingrédients'
        unique_together = ['original_ingredient', 'substitute_ingredient']
        ordering = ['original_ingredient', 'priority']

    def __str__(self):
        return f"{self.original_ingredient.nom} → {self.substitute_ingredient.nom} (ratio: {self.conversion_ratio})"

    def clean(self):
        """Validation personnalisée"""
        if self.original_ingredient == self.substitute_ingredient:
            raise ValidationError("Un ingrédient ne peut pas être son propre substitut")

        # Vérifier les unités compatibles
        if self.original_ingredient.unite != self.substitute_ingredient.unite:
            # Permettre certaines conversions logiques
            compatible_units = [
                ('kg', 'g'), ('g', 'kg'),
                ('L', 'ml'), ('ml', 'L')
            ]
            units_pair = (self.original_ingredient.unite, self.substitute_ingredient.unite)
            if units_pair not in compatible_units:
                raise ValidationError(
                    f"Unités incompatibles: {self.original_ingredient.unite} et {self.substitute_ingredient.unite}"
                )

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class RecipePreparationBatch(models.Model):
    """
    Modèle pour tracer les lots de préparation de recettes
    Permet le rollback en cas d'erreur ou d'annulation
    """

    recipe = models.ForeignKey(
        Recipe,
        on_delete=models.CASCADE,
        related_name='preparation_batches',
        verbose_name='Recette'
    )

    quantity_prepared = models.PositiveIntegerField(
        verbose_name='Quantité préparée'
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        verbose_name='Utilisateur'
    )

    status = models.CharField(
        max_length=20,
        choices=[
            ('in_progress', 'En cours'),
            ('completed', 'Terminée'),
            ('cancelled', 'Annulée'),
            ('rolled_back', 'Annulée (rollback)')
        ],
        default='in_progress',
        verbose_name='Statut'
    )

    total_cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Coût total'
    )

    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name='Notes'
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )

    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='Date de fin'
    )

    class Meta:
        verbose_name = 'Lot de préparation'
        verbose_name_plural = 'Lots de préparation'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.recipe.nom_recette} x{self.quantity_prepared} - {self.get_status_display()}"

    @transaction.atomic
    def rollback(self, user=None):
        """
        Annule la préparation et restaure les stocks des ingrédients
        """
        if self.status not in ['completed', 'in_progress']:
            raise ValidationError("Seules les préparations terminées ou en cours peuvent être annulées")

        rollback_user = user or self.user
        rollback_movements = []

        try:
            # Récupérer tous les mouvements liés à cette préparation
            batch_reference = f"BATCH-{self.id}"
            preparation_movements = IngredientMovement.objects.filter(
                reason='consumption',
                reference=batch_reference
            )

            if not preparation_movements.exists():
                # Chercher par notes si pas de référence
                preparation_movements = IngredientMovement.objects.filter(
                    reason='consumption',
                    notes__contains=f"Préparation de {self.quantity_prepared}x {self.recipe.nom_recette}",
                    created_at__gte=self.created_at
                )

            # Créer des mouvements de compensation (entrées)
            for movement in preparation_movements:
                # Restaurer le stock
                ingredient = movement.ingredient
                old_stock = ingredient.quantite_restante
                ingredient.quantite_restante += movement.quantity
                ingredient.save()

                # Créer un mouvement de rollback
                rollback_movement = IngredientMovement.objects.create(
                    ingredient=ingredient,
                    movement_type='in',
                    reason='correction',
                    quantity=movement.quantity,
                    stock_before=old_stock,
                    stock_after=ingredient.quantite_restante,
                    user=rollback_user,
                    notes=f"Rollback lot #{self.id} - {self.recipe.nom_recette}",
                    reference=f"ROLLBACK-{self.id}"
                )
                rollback_movements.append(rollback_movement)

            # Marquer la préparation comme annulée
            self.status = 'rolled_back'
            self.save()

            print(f"✅ Rollback réussi pour lot #{self.id}")
            print(f"   📋 {len(rollback_movements)} mouvements de compensation créés")

        except Exception as e:
            print(f"❌ Erreur lors du rollback: {e}")
            raise

        return rollback_movements
