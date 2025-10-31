// Générateur de facture offline
// Génère une facture complète sans connexion internet

interface InvoiceItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  product_code?: string;
}

interface InvoiceData {
  invoice_number: string;
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    tax_number: string;
  };
  customer: {
    name: string;
    table: string;
    datetime_full: string;
  };
  server: {
    name: string;
  };
  items: InvoiceItem[];
  summary: {
    total_items: number;
    total_quantity: number;
    subtotal: number;
    total_amount: number;
    amount_in_words: string;
  };
  payment: {
    method: string;
    currency_symbol: string;
  };
  footer_message: string;
}

// Convertir un nombre en lettres (français)
function numberToWords(num: number): string {
  if (num === 0) return 'zéro';
  
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  const thousands = ['', 'mille', 'million', 'milliard'];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return '';
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const unit = n % 10;
      if (ten === 7 || ten === 9) {
        return tens[ten - 1] + '-' + teens[unit];
      }
      return tens[ten] + (unit ? '-' + units[unit] : '');
    }
    
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let result = (hundred > 1 ? units[hundred] + ' ' : '') + 'cent';
    if (rest) result += ' ' + convertLessThanThousand(rest);
    return result;
  }

  if (num < 1000) return convertLessThanThousand(num);
  
  let result = '';
  let thousandIndex = 0;
  
  while (num > 0) {
    const chunk = num % 1000;
    if (chunk !== 0) {
      const chunkWords = convertLessThanThousand(chunk);
      result = chunkWords + (thousands[thousandIndex] ? ' ' + thousands[thousandIndex] : '') + (result ? ' ' + result : '');
    }
    num = Math.floor(num / 1000);
    thousandIndex++;
  }
  
  return result.trim();
}

// Générer une facture offline
export function generateOfflineInvoice(
  saleId: string | number,
  customerName: string,
  tableNumber: string,
  serverName: string,
  items: Array<{ name: string; quantity: number; price: number; product_code?: string }>,
  totalAmount: number
): InvoiceData {
  // Générer numéro de facture
  const now = new Date();
  const invoiceNumber = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(saleId).padStart(6, '0')}`;
  
  // Formater date et heure
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  const datetimeFull = now.toLocaleDateString('fr-FR', dateOptions);

  // Préparer les items
  const invoiceItems: InvoiceItem[] = items.map(item => ({
    name: item.name,
    quantity: item.quantity,
    unit_price: item.price,
    total: item.price * item.quantity,
    product_code: item.product_code || 'N/A'
  }));

  // Calculer le résumé
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = totalAmount;
  const amountInWords = numberToWords(Math.floor(totalAmount)) + ' francs burundais';

  // Informations de l'entreprise (à personnaliser)
  const company = {
    name: 'BarStock Restaurant',
    address: 'Bujumbura, Burundi',
    phone: '+257 XX XX XX XX',
    email: 'contact@barstock.bi',
    tax_number: 'NIF: XXXXXXXXX'
  };

  return {
    invoice_number: invoiceNumber,
    company,
    customer: {
      name: customerName || 'Client',
      table: tableNumber || 'N/A',
      datetime_full: datetimeFull
    },
    server: {
      name: serverName || 'Serveur'
    },
    items: invoiceItems,
    summary: {
      total_items: totalItems,
      total_quantity: totalQuantity,
      subtotal,
      total_amount: totalAmount,
      amount_in_words: amountInWords
    },
    payment: {
      method: 'Cash',
      currency_symbol: 'BIF'
    },
    footer_message: 'Merci de votre visite ! À bientôt.'
  };
}

// Générer une facture depuis les données en cache
export async function generateInvoiceFromCache(saleId: string): Promise<InvoiceData | null> {
  try {
    const { offlineStorage } = await import('@/services/offline-storage');
    
    // Récupérer la vente depuis le cache
    const saleRecord = await offlineStorage.getSale(saleId);
    if (!saleRecord) {
      console.error('Vente non trouvée dans le cache:', saleId);
      return null;
    }

    const sale = saleRecord.data;
    
    return generateOfflineInvoice(
      saleId,
      sale.customer_name || 'Client',
      sale.table_number || sale.table || 'N/A',
      sale.server_name || 'Serveur',
      sale.items || [],
      parseFloat(sale.total_amount || sale.total || 0)
    );
  } catch (error) {
    console.error('Erreur génération facture depuis cache:', error);
    return null;
  }
}
