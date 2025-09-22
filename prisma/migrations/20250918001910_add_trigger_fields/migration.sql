/*
  Warnings:

  - Added the required column `name` to the `flow_triggers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `flow_triggers` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_flow_triggers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flowId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "triggerValue" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "config" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "flow_triggers_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "message_flows" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_flow_triggers" ("createdAt", "flowId", "id", "isActive", "triggerType", "triggerValue", "name", "updatedAt")
SELECT "createdAt", "flowId", "id", "isActive", "triggerType", "triggerValue",
       CASE
         WHEN "triggerType" = 'KEYWORD' THEN 'Gatilho de Palavra-chave'
         WHEN "triggerType" = 'SCHEDULE' THEN 'Gatilho de Agendamento'
         WHEN "triggerType" = 'EVENT' THEN 'Gatilho de Evento'
         ELSE 'Gatilho Manual'
       END as "name",
       CURRENT_TIMESTAMP as "updatedAt"
FROM "flow_triggers";
DROP TABLE "flow_triggers";
ALTER TABLE "new_flow_triggers" RENAME TO "flow_triggers";
CREATE INDEX "flow_triggers_triggerType_triggerValue_idx" ON "flow_triggers"("triggerType", "triggerValue");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
