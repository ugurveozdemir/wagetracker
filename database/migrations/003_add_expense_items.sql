-- WageTracker Multi-Item Expense Migration
-- Supabase PostgreSQL Migration

ALTER TABLE "Expenses"
ADD COLUMN "PurchaseType" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "MerchantName" VARCHAR(160) NULL,
ADD COLUMN "SubtotalAmount" DECIMAL(18,2) NULL,
ADD COLUMN "TaxAmount" DECIMAL(18,2) NULL,
ADD COLUMN "DiscountAmount" DECIMAL(18,2) NULL,
ADD COLUMN "ReceiptScanConfidence" DECIMAL(5,4) NULL,
ADD COLUMN "ReceiptWarningsJson" TEXT NULL;

COMMENT ON COLUMN "Expenses"."PurchaseType" IS 'Purchase type - 0:Single, 1:MultiItem';
COMMENT ON COLUMN "Expenses"."MerchantName" IS 'Merchant/store name extracted from receipt scans';
COMMENT ON COLUMN "Expenses"."ReceiptWarningsJson" IS 'Receipt scan warnings stored as JSON text';

CREATE TABLE "ExpenseItems" (
    "Id" SERIAL PRIMARY KEY,
    "ExpenseId" INTEGER NOT NULL REFERENCES "Expenses"("Id") ON DELETE CASCADE,
    "Name" VARCHAR(160) NOT NULL,
    "TotalAmount" DECIMAL(18,2) NOT NULL,
    "Quantity" DECIMAL(18,3) NULL,
    "UnitPrice" DECIMAL(18,2) NULL,
    "Category" INTEGER NOT NULL DEFAULT 7,
    "Tag" VARCHAR(40) NOT NULL DEFAULT 'other',
    "Kind" INTEGER NOT NULL DEFAULT 0,
    "Confidence" DECIMAL(5,4) NULL,
    "SortOrder" INTEGER NOT NULL DEFAULT 0,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE "ExpenseItems" IS 'Item-level sub-buyings attached to one parent expense';
COMMENT ON COLUMN "ExpenseItems"."Kind" IS 'Item kind - 0:Product, 1:Tax, 2:Discount, 3:Fee, 4:Adjustment';
COMMENT ON COLUMN "ExpenseItems"."Tag" IS 'Item-level analytical tag such as groceries, household, tax_fee, discount, adjustment';

CREATE INDEX "IX_ExpenseItems_ExpenseId" ON "ExpenseItems"("ExpenseId");
CREATE INDEX "IX_ExpenseItems_ExpenseId_SortOrder" ON "ExpenseItems"("ExpenseId", "SortOrder");
