#!/usr/bin/env python3
"""
Script pour nettoyer le fichier views.py et supprimer la duplication
"""

def clean_views_file():
    """Nettoie le fichier views.py en supprimant le contenu dupliqué"""
    
    # Lire le fichier
    with open('reports/views.py', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Trouver la fin de la première fonction dashboard_stats (ligne 325)
    # et supprimer tout ce qui vient après la fonction report_summary
    
    clean_lines = []
    for i, line in enumerate(lines):
        # Garder tout jusqu'à la ligne 433 (fin de report_summary)
        if i < 433:
            clean_lines.append(line)
        else:
            break
    
    # Écrire le fichier nettoyé
    with open('reports/views.py', 'w', encoding='utf-8') as f:
        f.writelines(clean_lines)
    
    print(f"✅ Fichier nettoyé ! {len(clean_lines)} lignes conservées.")
    print("🗑️  Contenu dupliqué supprimé.")

if __name__ == '__main__':
    clean_views_file()
