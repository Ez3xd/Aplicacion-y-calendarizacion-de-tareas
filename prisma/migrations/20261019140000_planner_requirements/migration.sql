-- Planner requirements: richer tasks, reminders, recurrence and subtasks.
CREATE TYPE "TaskPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

ALTER TABLE "Task"
  ADD COLUMN "location" TEXT,
  ADD COLUMN "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN "recurrence" TEXT,
  ADD COLUMN "recurrenceEnd" DATE,
  ADD COLUMN "reminderMinutes" INTEGER,
  ADD COLUMN "parentTaskId" TEXT;

CREATE INDEX "Task_userId_parentTaskId_idx" ON "Task"("userId", "parentTaskId");

ALTER TABLE "Task"
  ADD CONSTRAINT "Task_parentTaskId_fkey"
  FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
