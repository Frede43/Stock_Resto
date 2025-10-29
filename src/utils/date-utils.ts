/**
 * Utilitaires pour la gestion des dates et heures
 * Timezone: Africa/Bujumbura (UTC+2)
 */

/**
 * Formate une date pour l'affichage en français (Burundi)
 */
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formate une heure pour l'affichage
 */
export const formatTime = (date: string | Date): string => {
  return new Date(date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formate une date et heure complète
 */
export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Formate une date pour l'API (YYYY-MM-DD)
 */
export const formatDateForAPI = (date: Date = new Date()): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Formate une date/heure pour l'API (ISO 8601)
 */
export const formatDateTimeForAPI = (date: Date = new Date()): string => {
  return date.toISOString();
};

/**
 * Calcule le temps écoulé depuis une date
 */
export const getTimeAgo = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMinutes < 1) return 'À l\'instant';
  if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return formatDate(date);
};

/**
 * Vérifie si une date est aujourd'hui
 */
export const isToday = (date: string | Date): boolean => {
  const today = new Date();
  const checkDate = new Date(date);
  
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Vérifie si une date est dans le passé
 */
export const isPast = (date: string | Date): boolean => {
  return new Date(date) < new Date();
};

/**
 * Vérifie si une date est dans le futur
 */
export const isFuture = (date: string | Date): boolean => {
  return new Date(date) > new Date();
};

/**
 * Obtient le début de la journée
 */
export const getStartOfDay = (date: Date = new Date()): Date => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
};

/**
 * Obtient la fin de la journée
 */
export const getEndOfDay = (date: Date = new Date()): Date => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

/**
 * Ajoute des jours à une date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Soustrait des jours à une date
 */
export const subtractDays = (date: Date, days: number): Date => {
  return addDays(date, -days);
};

/**
 * Obtient la plage de dates pour une période
 */
export const getDateRange = (period: 'today' | 'week' | 'month' | 'year'): { start: Date; end: Date } => {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  
  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
  }
  
  return { start, end };
};

/**
 * Formate une durée en minutes en format lisible
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}min`;
};

/**
 * Parse une date de l'API
 */
export const parseAPIDate = (dateString: string): Date => {
  return new Date(dateString);
};

/**
 * Obtient le nom du jour en français
 */
export const getDayName = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' });
};

/**
 * Obtient le nom du mois en français
 */
export const getMonthName = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('fr-FR', { month: 'long' });
};

/**
 * Formate une date de manière relative (aujourd'hui, hier, etc.)
 */
export const formatRelativeDate = (date: string | Date): string => {
  const checkDate = new Date(date);
  const today = new Date();
  const yesterday = subtractDays(today, 1);
  
  if (isToday(checkDate)) {
    return `Aujourd'hui à ${formatTime(checkDate)}`;
  }
  
  if (
    checkDate.getDate() === yesterday.getDate() &&
    checkDate.getMonth() === yesterday.getMonth() &&
    checkDate.getFullYear() === yesterday.getFullYear()
  ) {
    return `Hier à ${formatTime(checkDate)}`;
  }
  
  return formatDateTime(checkDate);
};

/**
 * Vérifie si deux dates sont le même jour
 */
export const isSameDay = (date1: string | Date, date2: string | Date): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

/**
 * Obtient l'heure actuelle du Burundi (pour affichage)
 */
export const getCurrentBurundiTime = (): string => {
  return formatTime(new Date());
};

/**
 * Obtient la date actuelle du Burundi (pour affichage)
 */
export const getCurrentBurundiDate = (): string => {
  return formatDate(new Date());
};
