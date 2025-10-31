@echo off
git add src/components/sales/PayButton.tsx
git add src/utils/invoice-generator.ts
git add src/pages/Sales.tsx
git add OFFLINE_PAYMENT_INVOICE.md
git commit -m "feat: Paiement et facture fonctionnent offline - Generation locale de facture"
git push origin main
