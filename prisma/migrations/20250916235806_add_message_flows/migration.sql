-- CreateTable
CREATE TABLE "message_flows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "message_flows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "flow_steps" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flowId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stepType" TEXT NOT NULL,
    "messageType" TEXT,
    "content" TEXT,
    "mediaUrl" TEXT,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "conditions" TEXT,
    "actions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "flow_steps_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "message_flows" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "flow_executions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flowId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "currentStepId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "data" TEXT,
    CONSTRAINT "flow_executions_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "message_flows" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "flow_executions_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "whatsapp_conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "flow_executions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "whatsapp_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "flow_executions_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "flow_steps" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "flow_triggers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flowId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "flow_triggers_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "message_flows" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "campaign_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "content" TEXT,
    "mediaUrl" TEXT,
    "targetAudience" TEXT,
    "scheduledAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "readCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "campaign_messages_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "whatsapp_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contact_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contact_tags_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "whatsapp_conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audio_generations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "voice" TEXT NOT NULL DEFAULT 'pt-BR-Wavenet-A',
    "audioUrl" TEXT,
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "audio_generations_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "whatsapp_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "message_flows_userId_name_key" ON "message_flows"("userId", "name");

-- CreateIndex
CREATE INDEX "flow_steps_flowId_stepOrder_idx" ON "flow_steps"("flowId", "stepOrder");

-- CreateIndex
CREATE INDEX "flow_executions_conversationId_status_idx" ON "flow_executions"("conversationId", "status");

-- CreateIndex
CREATE INDEX "flow_triggers_triggerType_triggerValue_idx" ON "flow_triggers"("triggerType", "triggerValue");

-- CreateIndex
CREATE INDEX "contact_tags_conversationId_tag_idx" ON "contact_tags"("conversationId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "contact_tags_conversationId_tag_key" ON "contact_tags"("conversationId", "tag");
