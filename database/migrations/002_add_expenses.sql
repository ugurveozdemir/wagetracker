-- WageTracker Expense Table Migration
-- Supabase PostgreSQL Migration
-- Created: 2026-04-06

-- ============================================
-- Expenses Table
-- ============================================
CREATE TABLE "Expenses" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "Amount" DECIMAL(18,2) NOT NULL,
    "Category" INTEGER NOT NULL DEFAULT 7,
    "Date" TIMESTAMP NOT NULL,
    "Description" VARCHAR(250) NULL,
    "Source" INTEGER NOT NULL DEFAULT 0,
    "ReceiptImageUrl" VARCHAR(500) NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE "Expenses" IS 'Kullanıcı gider kayıtları';
COMMENT ON COLUMN "Expenses"."Category" IS 'Gider kategorisi - 0:FoodAndDrinks, 1:Transport, 2:Shopping, 3:BillsAndUtilities, 4:Entertainment, 5:Health, 6:Education, 7:Other';
COMMENT ON COLUMN "Expenses"."Source" IS 'Gider kaynağı - 0:Manual (elle girildi), 1:ReceiptScan (AI fiş taramasından)';
COMMENT ON COLUMN "Expenses"."ReceiptImageUrl" IS 'AI fiş taraması için fiş fotoğrafı URL si - Gelecek feature için hazır';

-- ============================================
-- Indexes (Performance Optimization)
-- ============================================
CREATE INDEX "IX_Expenses_UserId" ON "Expenses"("UserId");
CREATE INDEX "IX_Expenses_UserId_Date" ON "Expenses"("UserId", "Date" DESC);

COMMENT ON INDEX "IX_Expenses_UserId_Date" IS 'Kullanıcının tarih bazlı gider sorgularını hızlandırır';
