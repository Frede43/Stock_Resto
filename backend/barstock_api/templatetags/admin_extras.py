"""
Filtres personnalisés pour les templates d'administration Django
"""

from django import template
from django.utils.safestring import mark_safe
import json

register = template.Library()


@register.filter
def multiply(value, arg):
    """Multiplie une valeur par un argument"""
    try:
        return float(value) * float(arg)
    except (ValueError, TypeError):
        return 0


@register.filter
def percentage(value, total):
    """Calcule le pourcentage d'une valeur par rapport au total"""
    try:
        if float(total) == 0:
            return 0
        return round((float(value) / float(total)) * 100, 1)
    except (ValueError, TypeError, ZeroDivisionError):
        return 0


@register.filter
def chart_height(value, max_value=None):
    """Calcule la hauteur d'une barre de graphique"""
    try:
        if max_value is None:
            max_value = 100
        height = (float(value) / float(max_value)) * 150  # 150px max height
        return max(20, min(150, height))  # Entre 20px et 150px
    except (ValueError, TypeError, ZeroDivisionError):
        return 20


@register.filter
def format_currency(value):
    """Formate une valeur en devise"""
    try:
        return f"{float(value):.2f}€"
    except (ValueError, TypeError):
        return "0.00€"


@register.filter
def json_script_safe(value):
    """Convertit une valeur Python en JSON sécurisé pour JavaScript"""
    return mark_safe(json.dumps(value))


@register.simple_tag
def chart_data(sales_data):
    """Prépare les données pour les graphiques JavaScript"""
    try:
        labels = []
        values = []
        for sale in sales_data:
            labels.append(sale.get('created_at__date', '').strftime('%d/%m') if sale.get('created_at__date') else '')
            values.append(sale.get('count', 0))
        
        return {
            'labels': labels,
            'values': values
        }
    except Exception:
        return {'labels': [], 'values': []}


@register.inclusion_tag('admin/widgets/stat_card.html')
def stat_card(title, value, icon, color="primary", description=""):
    """Widget de carte de statistique réutilisable"""
    return {
        'title': title,
        'value': value,
        'icon': icon,
        'color': color,
        'description': description
    }


@register.inclusion_tag('admin/widgets/progress_bar.html')
def progress_bar(value, max_value, color="primary", show_percentage=True):
    """Widget de barre de progression"""
    try:
        percentage = (float(value) / float(max_value)) * 100 if max_value > 0 else 0
        percentage = min(100, max(0, percentage))
    except (ValueError, TypeError, ZeroDivisionError):
        percentage = 0
    
    return {
        'value': value,
        'max_value': max_value,
        'percentage': percentage,
        'color': color,
        'show_percentage': show_percentage
    }


@register.filter
def get_item(dictionary, key):
    """Récupère un élément d'un dictionnaire par clé"""
    try:
        return dictionary.get(key)
    except (AttributeError, TypeError):
        return None


@register.filter
def add_class(field, css_class):
    """Ajoute une classe CSS à un champ de formulaire"""
    return field.as_widget(attrs={"class": css_class})


@register.simple_tag
def url_replace(request, field, value):
    """Remplace un paramètre dans l'URL actuelle"""
    dict_ = request.GET.copy()
    dict_[field] = value
    return dict_.urlencode()


@register.filter
def truncate_chars(value, max_length):
    """Tronque un texte à une longueur maximale"""
    try:
        if len(str(value)) > max_length:
            return str(value)[:max_length] + "..."
        return str(value)
    except (TypeError, AttributeError):
        return ""


@register.simple_tag
def get_verbose_name(instance, field_name):
    """Récupère le nom verbose d'un champ de modèle"""
    try:
        return instance._meta.get_field(field_name).verbose_name
    except Exception:
        return field_name


@register.filter
def model_name(obj):
    """Récupère le nom du modèle d'un objet"""
    try:
        return obj._meta.verbose_name
    except AttributeError:
        return str(type(obj).__name__)


@register.filter
def model_name_plural(obj):
    """Récupère le nom pluriel du modèle d'un objet"""
    try:
        return obj._meta.verbose_name_plural
    except AttributeError:
        return str(type(obj).__name__)
