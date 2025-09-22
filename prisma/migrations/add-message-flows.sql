-- CreateTable
CREATE TABLE "MessageFlow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" TEXT NOT NULL, -- 'KEYWORD', 'NEW_CONTACT', 'TIME_BASED', 'MANUAL'
    "triggerValue" TEXT, -- keyword or time expression
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MessageFlow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FlowStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flowId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "stepType" TEXT NOT NULL, -- 'MESSAGE', 'DELAY', 'CONDITION', 'ACTION'
    "messageType" TEXT, -- 'TEXT', 'AUDIO', 'IMAGE', 'VIDEO', 'DOCUMENT'
    "content" TEXT,
    "mediaUrl" TEXT,
    "delayMinutes" INTEGER DEFAULT 0,
    "conditions" TEXT, -- JSON for conditional logic
    "actions" TEXT, -- JSON for actions like tags, assignments
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FlowStep_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "MessageFlow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FlowExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flowId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "currentStepId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'RUNNING', -- 'RUNNING', 'COMPLETED', 'PAUSED', 'FAILED'
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "data" TEXT, -- JSON for execution context
    CONSTRAINT "FlowExecution_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "MessageFlow" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FlowExecution_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsAppConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FlowExecution_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "WhatsAppAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FlowExecution_currentStepId_fkey" FOREIGN KEY ("currentStepId") REFERENCES "FlowStep" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FlowTrigger" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flowId" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FlowTrigger_flowId_fkey" FOREIGN KEY ("flowId") REFERENCES "MessageFlow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CampaignMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "messageType" TEXT NOT NULL, -- 'TEXT', 'AUDIO', 'IMAGE', 'VIDEO'
    "content" TEXT,
    "mediaUrl" TEXT,
    "targetAudience" TEXT, -- JSON for filtering criteria
    "scheduledAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'SCHEDULED', 'SENDING', 'COMPLETED', 'FAILED'
    "sentCount" INTEGER DEFAULT 0,
    "deliveredCount" INTEGER DEFAULT 0,
    "readCount" INTEGER DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CampaignMessage_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "WhatsAppAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContactTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "conversationId" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContactTag_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsAppConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AudioGeneration" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "voice" TEXT NOT NULL DEFAULT 'pt-BR-Wavenet-A',
    "audioUrl" TEXT,
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'GENERATING', 'COMPLETED', 'FAILED'
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "AudioGeneration_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "WhatsAppAccount" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MessageFlow_userId_name_key" ON "MessageFlow"("userId", "name");

-- CreateIndex
CREATE INDEX "FlowStep_flowId_stepOrder_idx" ON "FlowStep"("flowId", "stepOrder");

-- CreateIndex
CREATE INDEX "FlowExecution_conversationId_status_idx" ON "FlowExecution"("conversationId", "status");

-- CreateIndex
CREATE INDEX "FlowTrigger_triggerType_triggerValue_idx" ON "FlowTrigger"("triggerType", "triggerValue");

-- CreateIndex
CREATE INDEX "ContactTag_conversationId_tag_idx" ON "ContactTag"("conversationId", "tag");

-- CreateIndex
CREATE UNIQUE INDEX "ContactTag_conversationId_tag_key" ON "ContactTag"("conversationId", "tag");