-- Switches the revenue model from "flat £10 cut per tip" to "£10/room
-- monthly subscription, capped at £50, with guest tips passed through
-- 100% to the property". Backfill values for the three new Transaction
-- columns are placeholders only — `npm run db:seed` overwrites every row
-- immediately after this migration runs, so no historical data is lost
-- or needs to be exactly right here.

-- CreateTable
CREATE TABLE "SubscriptionInvoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "amountPence" INTEGER NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PAID',
    "stripeInvoiceId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubscriptionInvoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "address" TEXT,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "staffCount" INTEGER NOT NULL DEFAULT 1,
    "roomCount" INTEGER NOT NULL DEFAULT 1,
    "subscriptionFeePence" INTEGER NOT NULL DEFAULT 1000,
    "billingStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "transactionFeePercent" INTEGER NOT NULL DEFAULT 0,
    "stripeAccountId" TEXT,
    "stripeStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leadId" TEXT,
    CONSTRAINT "Client_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("address", "contactName", "email", "id", "joinedAt", "leadId", "name", "phone", "propertyType", "slug", "staffCount", "stripeAccountId", "stripeStatus") SELECT "address", "contactName", "email", "id", "joinedAt", "leadId", "name", "phone", "propertyType", "slug", "staffCount", "stripeAccountId", "stripeStatus" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_slug_key" ON "Client"("slug");
CREATE UNIQUE INDEX "Client_leadId_key" ON "Client"("leadId");
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "businessName" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'NEW',
    "source" TEXT NOT NULL DEFAULT 'OTHER',
    "roomCount" INTEGER NOT NULL DEFAULT 1,
    "estMonthlyTips" INTEGER,
    "notes" TEXT,
    "assignedToId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("assignedToId", "businessName", "contactName", "createdAt", "email", "estMonthlyTips", "id", "notes", "phone", "propertyType", "source", "stage", "updatedAt") SELECT "assignedToId", "businessName", "contactName", "createdAt", "email", "estMonthlyTips", "id", "notes", "phone", "propertyType", "source", "stage", "updatedAt" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "guestName" TEXT,
    "tipAmountPence" INTEGER NOT NULL,
    "stripeFeePence" INTEGER NOT NULL,
    "platformFeePence" INTEGER NOT NULL,
    "totalChargedPence" INTEGER NOT NULL,
    "netAmountPence" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "stripePaymentIntentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCEEDED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payoutId" TEXT,
    CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "ClientPayout" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("clientId", "createdAt", "currency", "guestName", "id", "netAmountPence", "payoutId", "platformFeePence", "status", "stripePaymentIntentId", "tipAmountPence", "stripeFeePence", "totalChargedPence")
SELECT "clientId", "createdAt", "currency", "guestName", "id", "netAmountPence", "payoutId", "platformFeePence", "status", "stripePaymentIntentId", "netAmountPence" AS "tipAmountPence", 0 AS "stripeFeePence", "amountPence" AS "totalChargedPence"
FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
