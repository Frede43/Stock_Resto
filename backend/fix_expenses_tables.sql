-- Script pour mettre à jour les tables expenses existantes

-- Ajouter les colonnes manquantes à expenses_expensecategory si elles n'existent pas
ALTER TABLE expenses_expensecategory 
ADD COLUMN IF NOT EXISTS category_type VARCHAR(20) DEFAULT 'other';

ALTER TABLE expenses_expensecategory 
ADD COLUMN IF NOT EXISTS budget_monthly DECIMAL(12, 2);

ALTER TABLE expenses_expensecategory 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;

ALTER TABLE expenses_expensecategory 
ADD COLUMN IF NOT EXISTS approval_threshold DECIMAL(12, 2);

-- Ajouter les colonnes manquantes à expenses_expense si elles n'existent pas
ALTER TABLE expenses_expense 
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100) DEFAULT '';

ALTER TABLE expenses_expense 
ADD COLUMN IF NOT EXISTS supplier_id INTEGER REFERENCES suppliers_supplier(id) ON DELETE SET NULL;

ALTER TABLE expenses_expense 
ADD COLUMN IF NOT EXISTS due_date DATE;

ALTER TABLE expenses_expense 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

ALTER TABLE expenses_expense 
ADD COLUMN IF NOT EXISTS recurrence_period VARCHAR(20);

-- Créer la table expenses_expensebudget si elle n'existe pas
CREATE TABLE IF NOT EXISTS expenses_expensebudget (
    id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES expenses_expensecategory(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    budget_amount DECIMAL(12, 2) NOT NULL,
    actual_amount DECIMAL(12, 2) DEFAULT 0,
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, year, month)
);

-- Créer les index
CREATE INDEX IF NOT EXISTS expenses_expense_expense_date_idx ON expenses_expense(expense_date);
CREATE INDEX IF NOT EXISTS expenses_expense_status_idx ON expenses_expense(status);
CREATE INDEX IF NOT EXISTS expenses_expense_category_id_idx ON expenses_expense(category_id);
CREATE INDEX IF NOT EXISTS expenses_expense_created_by_id_idx ON expenses_expense(created_by_id);

COMMIT;
