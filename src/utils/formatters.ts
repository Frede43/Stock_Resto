/**
 * Utilitaires de formatage pour l'affichage des données
 */

/**
 * Formate un nombre pour éviter les décimales inutiles
 * @param value - La valeur à formater
 * @param maxDecimals - Nombre maximum de décimales (défaut: 3)
 * @returns La valeur formatée sans décimales inutiles
 */
export function formatNumber(value: number | string, maxDecimals: number = 3): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '0';
  
  // Si c'est un nombre entier, ne pas afficher de décimales
  if (num % 1 === 0) {
    return num.toString();
  }
  
  // Sinon, formater avec le nombre de décimales nécessaires (max 3)
  const formatted = num.toFixed(maxDecimals);
  
  // Supprimer les zéros inutiles à la fin
  return formatted.replace(/\.?0+$/, '');
}

/**
 * Formate une quantité avec son unité
 * @param quantity - La quantité
 * @param unit - L'unité
 * @returns La quantité formatée avec l'unité
 */
export function formatQuantity(quantity: number | string, unit: string): string {
  const formattedQuantity = formatNumber(quantity);
  return `${formattedQuantity} ${unit}`;
}

/**
 * Formate un prix en BIF
 * @param price - Le prix
 * @returns Le prix formaté
 */
export function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(num)) return '0 BIF';
  
  // Pour les prix, on garde 2 décimales maximum
  const formatted = formatNumber(num, 2);
  return `${formatted} BIF`;
}

/**
 * Formate un prix unitaire avec l'unité
 * @param price - Le prix
 * @param unit - L'unité
 * @returns Le prix formaté avec l'unité
 */
export function formatUnitPrice(price: number | string, unit: string): string {
  const formattedPrice = formatNumber(price, 2);
  return `${formattedPrice} BIF/${unit}`;
}
