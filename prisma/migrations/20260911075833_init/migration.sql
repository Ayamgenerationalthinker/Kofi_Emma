-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "experienceLevel" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Accra',
    "onboardedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CurriculumPhase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phaseId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "timeSignature" TEXT NOT NULL,
    "subdivision" TEXT NOT NULL,
    "stickingPattern" TEXT NOT NULL,
    "orchestrationJson" TEXT NOT NULL,
    "patternEventsJson" TEXT NOT NULL,
    "techniqueNotes" TEXT NOT NULL,
    "commonMistakes" TEXT NOT NULL,
    "targetBpm" INTEGER NOT NULL,
    "minimumBpm" INTEGER NOT NULL,
    "maximumBpm" INTEGER NOT NULL,
    "minimumAccuracy" INTEGER NOT NULL,
    "requiredConsecutiveCleanAttempts" INTEGER NOT NULL DEFAULT 2,
    "durationMinutes" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "styleLabel" TEXT NOT NULL DEFAULT 'Kofi Emma-inspired',
    CONSTRAINT "Exercise_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "CurriculumPhase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExercisePrerequisite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "exerciseId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,
    CONSTRAINT "ExercisePrerequisite_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExercisePrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserExerciseProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
    "cleanBpm" INTEGER NOT NULL DEFAULT 0,
    "bestAccuracy" INTEGER NOT NULL DEFAULT 0,
    "consecutiveCleanCount" INTEGER NOT NULL DEFAULT 0,
    "attemptsCount" INTEGER NOT NULL DEFAULT 0,
    "masteredAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserExerciseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserExerciseProgress_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "totalMinutes" INTEGER NOT NULL DEFAULT 55,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "dailyLessonId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PracticeSession_dailyLessonId_fkey" FOREIGN KEY ("dailyLessonId") REFERENCES "DailyLesson" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExerciseAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientAttemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sessionId" TEXT,
    "targetBpm" INTEGER NOT NULL,
    "cleanBpm" INTEGER NOT NULL,
    "maximumBpm" INTEGER,
    "accuracy" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "perceivedDifficulty" INTEGER NOT NULL DEFAULT 3,
    "notes" TEXT,
    "result" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExerciseAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExerciseAttempt_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ExerciseAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DailyLesson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "totalMinutes" INTEGER NOT NULL DEFAULT 55,
    "phaseId" TEXT NOT NULL,
    "wasRecoverySession" BOOLEAN NOT NULL DEFAULT false,
    "lessonPartsJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DailyLesson_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BpmRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "cleanBpm" INTEGER NOT NULL,
    "accuracy" INTEGER NOT NULL,
    "recordedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BpmRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BpmRecord_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReminderSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "notificationsOn" BOOLEAN NOT NULL DEFAULT true,
    "morningOn" BOOLEAN NOT NULL DEFAULT true,
    "eveningOn" BOOLEAN NOT NULL DEFAULT true,
    "morningTime" TEXT NOT NULL DEFAULT '07:00',
    "eveningTime" TEXT NOT NULL DEFAULT '19:00',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReminderSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalendarSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Accra',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalendarSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "preferredDurationMinutes" INTEGER NOT NULL DEFAULT 55,
    "defaultBpmIncrease" INTEGER NOT NULL DEFAULT 5,
    "accuracyThreshold" INTEGER NOT NULL DEFAULT 90,
    "metronomeVolume" INTEGER NOT NULL DEFAULT 80,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumPhase_number_key" ON "CurriculumPhase"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_slug_key" ON "Exercise"("slug");

-- CreateIndex
CREATE INDEX "Exercise_phaseId_idx" ON "Exercise"("phaseId");

-- CreateIndex
CREATE INDEX "ExercisePrerequisite_exerciseId_idx" ON "ExercisePrerequisite"("exerciseId");

-- CreateIndex
CREATE INDEX "ExercisePrerequisite_prerequisiteId_idx" ON "ExercisePrerequisite"("prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "ExercisePrerequisite_exerciseId_prerequisiteId_key" ON "ExercisePrerequisite"("exerciseId", "prerequisiteId");

-- CreateIndex
CREATE INDEX "UserExerciseProgress_userId_idx" ON "UserExerciseProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserExerciseProgress_userId_exerciseId_key" ON "UserExerciseProgress"("userId", "exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeSession_dailyLessonId_key" ON "PracticeSession"("dailyLessonId");

-- CreateIndex
CREATE INDEX "PracticeSession_userId_date_idx" ON "PracticeSession"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseAttempt_clientAttemptId_key" ON "ExerciseAttempt"("clientAttemptId");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_userId_exerciseId_idx" ON "ExerciseAttempt"("userId", "exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseAttempt_userId_createdAt_idx" ON "ExerciseAttempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DailyLesson_userId_date_idx" ON "DailyLesson"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyLesson_userId_date_key" ON "DailyLesson"("userId", "date");

-- CreateIndex
CREATE INDEX "BpmRecord_userId_exerciseId_recordedAt_idx" ON "BpmRecord"("userId", "exerciseId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReminderSettings_userId_key" ON "ReminderSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarSettings_userId_key" ON "CalendarSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
