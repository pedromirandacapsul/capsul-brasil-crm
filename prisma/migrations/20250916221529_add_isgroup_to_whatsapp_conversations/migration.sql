-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_whatsapp_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "contactName" TEXT,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "leadId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastMessageAt" DATETIME,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "assignedUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "whatsapp_conversations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "whatsapp_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "whatsapp_conversations_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "whatsapp_conversations_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_whatsapp_conversations" ("accountId", "assignedUserId", "contactName", "contactNumber", "createdAt", "id", "lastMessageAt", "leadId", "status", "unreadCount", "updatedAt") SELECT "accountId", "assignedUserId", "contactName", "contactNumber", "createdAt", "id", "lastMessageAt", "leadId", "status", "unreadCount", "updatedAt" FROM "whatsapp_conversations";
DROP TABLE "whatsapp_conversations";
ALTER TABLE "new_whatsapp_conversations" RENAME TO "whatsapp_conversations";
CREATE UNIQUE INDEX "whatsapp_conversations_accountId_contactNumber_key" ON "whatsapp_conversations"("accountId", "contactNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
