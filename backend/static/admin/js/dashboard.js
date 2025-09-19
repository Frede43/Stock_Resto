/**
 * JavaScript pour le dashboard d'administration BarStockWise
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // Initialiser les hauteurs des barres de graphique
    initializeChartBars();
    
    // Initialiser les barres de progression
    initializeProgressBars();
    
    // Configuration des graphiques
    const chartConfig = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: '#e5e7eb'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    };

    // Initialisation des graphiques si Chart.js est disponible
    if (typeof Chart !== 'undefined') {
        initializeCharts();
    }

    // Mise à jour des métriques temps réel
    updateRealTimeMetrics();
    
    // Actualisation automatique toutes les 30 secondes
    setInterval(updateRealTimeMetrics, 30000);
    
    // Animation des cartes de statistiques
    animateStatCards();
    
    // Initialisation des tooltips
    initializeTooltips();
});

/**
 * Initialise les hauteurs des barres de graphique
 */
function initializeChartBars() {
    const barValues = document.querySelectorAll('.bar-value[data-value]');
    
    if (barValues.length === 0) return;
    
    // Trouver la valeur maximale pour normaliser les hauteurs
    let maxValue = 0;
    barValues.forEach(bar => {
        const value = parseInt(bar.getAttribute('data-value')) || 0;
        maxValue = Math.max(maxValue, value);
    });
    
    // Appliquer les hauteurs avec animation
    barValues.forEach((bar, index) => {
        const value = parseInt(bar.getAttribute('data-value')) || 0;
        const height = maxValue > 0 ? Math.max(20, (value / maxValue) * 150) : 20;
        
        // Animation retardée pour chaque barre
        setTimeout(() => {
            bar.style.height = height + 'px';
            bar.style.transition = 'height 0.8s ease';
        }, index * 100);
    });
}

/**
 * Initialise les barres de progression
 */
function initializeProgressBars() {
    const progressFills = document.querySelectorAll('.progress-fill[data-percentage]');
    
    progressFills.forEach((fill, index) => {
        const percentage = parseFloat(fill.getAttribute('data-percentage')) || 0;
        
        // Animation retardée pour chaque barre
        setTimeout(() => {
            fill.style.width = Math.min(100, Math.max(0, percentage)) + '%';
            fill.style.transition = 'width 1s ease';
        }, index * 150);
    });
}

/**
 * Initialise les graphiques du dashboard
 */
function initializeCharts() {
    // Graphique des ventes
    const salesChart = document.getElementById('salesChart');
    if (salesChart) {
        const ctx = salesChart.getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: window.salesData?.labels || [],
                datasets: [{
                    data: window.salesData?.values || [],
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: chartConfig
        });
    }
    
    // Graphique en donut pour les produits
    const productsChart = document.getElementById('productsChart');
    if (productsChart) {
        const ctx = productsChart.getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: window.productsData?.labels || [],
                datasets: [{
                    data: window.productsData?.values || [],
                    backgroundColor: [
                        '#3b82f6',
                        '#10b981',
                        '#f59e0b',
                        '#ef4444',
                        '#8b5cf6'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

/**
 * Met à jour les métriques en temps réel
 */
async function updateRealTimeMetrics() {
    try {
        // Simulation de données temps réel (à remplacer par de vraies API calls)
        const metrics = await fetchRealTimeMetrics();
        
        updateMetricCard('daily-revenue', metrics.revenue, '€');
        updateMetricCard('pending-orders', metrics.orders);
        updateMetricCard('low-stock', metrics.lowStock);
        updateMetricCard('active-users', metrics.activeUsers);
        
        // Mise à jour de l'horodatage
        updateLastRefresh();
        
    } catch (error) {
        console.warn('Erreur lors de la mise à jour des métriques:', error);
    }
}

/**
 * Simule la récupération de métriques temps réel
 */
async function fetchRealTimeMetrics() {
    // Simulation - à remplacer par de vraies API calls
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                revenue: (Math.random() * 2000 + 500).toFixed(2),
                orders: Math.floor(Math.random() * 20 + 5),
                lowStock: Math.floor(Math.random() * 10 + 1),
                activeUsers: Math.floor(Math.random() * 50 + 10)
            });
        }, 500);
    });
}

/**
 * Met à jour une carte de métrique
 */
function updateMetricCard(elementId, value, suffix = '') {
    const element = document.getElementById(elementId);
    if (element) {
        // Animation de compteur
        animateCounter(element, value, suffix);
    }
}

/**
 * Anime un compteur numérique
 */
function animateCounter(element, targetValue, suffix = '') {
    const startValue = parseFloat(element.textContent) || 0;
    const target = parseFloat(targetValue);
    const duration = 1000; // 1 seconde
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Fonction d'easing
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = startValue + (target - startValue) * easeOutQuart;
        
        element.textContent = currentValue.toFixed(suffix === '€' ? 2 : 0) + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

/**
 * Anime les cartes de statistiques au chargement
 */
function animateStatCards() {
    const cards = document.querySelectorAll('.stat-card, .metric-card, .action-card');
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

/**
 * Met à jour l'horodatage de dernière actualisation
 */
function updateLastRefresh() {
    const refreshElement = document.getElementById('last-refresh');
    if (refreshElement) {
        const now = new Date();
        refreshElement.textContent = `Dernière mise à jour: ${now.toLocaleTimeString()}`;
    }
}

/**
 * Initialise les tooltips
 */
function initializeTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

/**
 * Affiche un tooltip
 */
function showTooltip(event) {
    const element = event.target;
    const tooltipText = element.getAttribute('data-tooltip');
    
    if (!tooltipText) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = tooltipText;
    tooltip.style.cssText = `
        position: absolute;
        background: #1f2937;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
    `;
    
    document.body.appendChild(tooltip);
    
    // Positionnement
    const rect = element.getBoundingClientRect();
    tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
    tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + 'px';
    
    // Animation d'apparition
    setTimeout(() => {
        tooltip.style.opacity = '1';
    }, 10);
    
    element._tooltip = tooltip;
}

/**
 * Cache un tooltip
 */
function hideTooltip(event) {
    const element = event.target;
    const tooltip = element._tooltip;
    
    if (tooltip) {
        tooltip.style.opacity = '0';
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, 200);
        delete element._tooltip;
    }
}

/**
 * Formate un nombre avec des séparateurs de milliers
 */
function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Formate une devise
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

/**
 * Utilitaire pour faire des requêtes API
 */
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken()
        }
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
}

/**
 * Récupère le token CSRF de Django
 */
function getCsrfToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'csrftoken') {
            return value;
        }
    }
    return '';
}

// Export pour utilisation dans d'autres scripts
window.DashboardUtils = {
    updateRealTimeMetrics,
    animateCounter,
    formatNumber,
    formatCurrency,
    apiRequest
};
