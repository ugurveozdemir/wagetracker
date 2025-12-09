-- WageTracker Initial Database Schema
-- Supabase PostgreSQL Migration
-- Created: 2025-12-09

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE "Users" (
    "Id" SERIAL PRIMARY KEY,
    "Email" VARCHAR(100) NOT NULL UNIQUE,
    "PasswordHash" VARCHAR(255) NOT NULL,
    "FullName" VARCHAR(100) NOT NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE "Users" IS 'Kullanıcı bilgileri';

-- ============================================
-- Jobs Table
-- ============================================
CREATE TABLE "Jobs" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "Title" VARCHAR(100) NOT NULL,
    "HourlyRate" DECIMAL(18,2) NOT NULL,
    "FirstDayOfWeek" INTEGER NOT NULL DEFAULT 1,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE "Jobs" IS 'Kullanıcının işleri (Starbucks, Freelance, vb.)';
COMMENT ON COLUMN "Jobs"."FirstDayOfWeek" IS 'Haftanın ilk günü - Overtime hesaplaması için (0=Sunday, 1=Monday, ..., 6=Saturday)';
COMMENT ON COLUMN "Jobs"."HourlyRate" IS 'Saatlik ücret';

-- ============================================
-- DailyEntries Table
-- ============================================
CREATE TABLE "DailyEntries" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
    "JobId" INTEGER NOT NULL REFERENCES "Jobs"("Id") ON DELETE CASCADE,
    "Date" TIMESTAMP NOT NULL,
    "StartTime" TIME NULL,
    "EndTime" TIME NULL,
    "TotalHours" DECIMAL(18,2) NOT NULL,
    "HourlyRateSnapshot" DECIMAL(18,2) NOT NULL,
    "TotalEarnings" DECIMAL(18,2) NOT NULL,
    "Tip" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "Note" VARCHAR(250) NULL,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE "DailyEntries" IS 'Günlük çalışma kayıtları';
COMMENT ON COLUMN "DailyEntries"."UserId" IS 'Performans için denormalize edildi - Job üzerinden join yapmadan direkt user entry lerini çekebilmek için';
COMMENT ON COLUMN "DailyEntries"."StartTime" IS 'Opsiyonel başlangıç saati - Girilirse TotalHours otomatik hesaplanır';
COMMENT ON COLUMN "DailyEntries"."EndTime" IS 'Opsiyonel bitiş saati - Girilirse TotalHours otomatik hesaplanır';
COMMENT ON COLUMN "DailyEntries"."HourlyRateSnapshot" IS 'Entry oluşturulduğunda Job.HourlyRate buraya kopyalanır - Historical data için';
COMMENT ON COLUMN "DailyEntries"."TotalEarnings" IS 'Hesaplanan kazanç: TotalHours × HourlyRateSnapshot + Tip';

-- ============================================
-- Indexes (Performance Optimization)
-- ============================================
CREATE INDEX "IX_Jobs_UserId" ON "Jobs"("UserId");
CREATE INDEX "IX_DailyEntries_UserId" ON "DailyEntries"("UserId");
CREATE INDEX "IX_DailyEntries_JobId" ON "DailyEntries"("JobId");
CREATE INDEX "IX_DailyEntries_Date" ON "DailyEntries"("Date");

-- Composite index for common queries
CREATE INDEX "IX_DailyEntries_UserId_Date" ON "DailyEntries"("UserId", "Date" DESC);
CREATE INDEX "IX_DailyEntries_JobId_Date" ON "DailyEntries"("JobId", "Date" DESC);

COMMENT ON INDEX "IX_DailyEntries_UserId_Date" IS 'Kullanıcının tarih bazlı entry sorgularını hızlandırır';
COMMENT ON INDEX "IX_DailyEntries_JobId_Date" IS 'İş bazlı tarih sorgularını hızlandırır';
