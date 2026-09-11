import { prisma } from "../db.js";
import { ensureProgressInitialized } from "../services/curriculumService.js";

export async function cleanDatabase() {
  await prisma.$transaction([
    prisma.bpmRecord.deleteMany(),
    prisma.exerciseAttempt.deleteMany(),
    prisma.dailyLesson.deleteMany(),
    prisma.practiceSession.deleteMany(),
    prisma.userExerciseProgress.deleteMany(),
    prisma.exercisePrerequisite.deleteMany(),
    prisma.exercise.deleteMany(),
    prisma.curriculumPhase.deleteMany(),
    prisma.reminderSettings.deleteMany(),
    prisma.calendarSettings.deleteMany(),
    prisma.userSettings.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function createTestUser(overrides: Partial<{ name: string; timezone: string }> = {}) {
  return prisma.user.create({
    data: {
      name: overrides.name ?? "Test Drummer",
      experienceLevel: "INTERMEDIATE",
      timezone: overrides.timezone ?? "Africa/Accra",
      onboardedAt: new Date(),
    },
  });
}

const baseExercise = {
  description: "Test exercise.",
  purpose: "Testing.",
  category: "TECHNIQUE",
  timeSignature: "4/4",
  subdivision: "16th",
  orchestrationJson: "[]",
  patternEventsJson: "[]",
  techniqueNotes: "Stay relaxed.",
  commonMistakes: "Rushing.",
  difficulty: 1,
};

/**
 * Minimal two-phase, three-exercise curriculum used across integration
 * tests: P1-E01 -> P1-E02 (same phase prerequisite) -> P2-E01 (locked
 * until all of Phase 1 is mastered).
 */
export async function seedMinimalCurriculum() {
  const phase1 = await prisma.curriculumPhase.create({
    data: {
      id: "phase-1",
      number: 1,
      title: "The Foundation & Highlife Pocket",
      subtitle: "Foundation",
      description: "Test phase 1",
      sortOrder: 1,
    },
  });
  const phase2 = await prisma.curriculumPhase.create({
    data: {
      id: "phase-2",
      number: 2,
      title: "Linear Subdivisions & Praise Medleys",
      subtitle: "Linear",
      description: "Test phase 2",
      sortOrder: 2,
    },
  });

  const e1 = await prisma.exercise.create({
    data: {
      id: "P1-E01",
      phaseId: phase1.id,
      name: "Single Stroke Control",
      slug: "single-stroke-control",
      stickingPattern: "R L R L",
      targetBpm: 100,
      minimumBpm: 60,
      maximumBpm: 140,
      minimumAccuracy: 90,
      requiredConsecutiveCleanAttempts: 2,
      durationMinutes: 10,
      sortOrder: 1,
      ...baseExercise,
    },
  });

  const e2 = await prisma.exercise.create({
    data: {
      id: "P1-E02",
      phaseId: phase1.id,
      name: "Double Stroke Control",
      slug: "double-stroke-control",
      stickingPattern: "R R L L",
      targetBpm: 110,
      minimumBpm: 60,
      maximumBpm: 150,
      minimumAccuracy: 90,
      requiredConsecutiveCleanAttempts: 2,
      durationMinutes: 10,
      sortOrder: 2,
      ...baseExercise,
    },
  });

  const e3 = await prisma.exercise.create({
    data: {
      id: "P2-E01",
      phaseId: phase2.id,
      name: "Six-Stroke Linear",
      slug: "six-stroke-linear",
      stickingPattern: "R L K K R L",
      targetBpm: 140,
      minimumBpm: 90,
      maximumBpm: 170,
      minimumAccuracy: 90,
      requiredConsecutiveCleanAttempts: 2,
      durationMinutes: 15,
      sortOrder: 1,
      ...baseExercise,
    },
  });

  await prisma.exercisePrerequisite.create({ data: { exerciseId: e2.id, prerequisiteId: e1.id } });
  await prisma.exercisePrerequisite.create({ data: { exerciseId: e3.id, prerequisiteId: e2.id } });

  return { phase1, phase2, e1, e2, e3 };
}

export async function initProgress(userId: string) {
  await ensureProgressInitialized(userId);
}
