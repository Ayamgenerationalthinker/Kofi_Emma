// npm run curriculum:validate — section 96. Statically validates the
// curriculum content defined in prisma/seed.ts before it ever touches the
// database: duplicate ids/slugs, missing prerequisites, circular
// dependencies, invalid phase references, and out-of-range BPM/accuracy.

import { PHASES, ALL_EXERCISES, computePrerequisitePairs } from "../prisma/seed.js";

interface ValidationError {
  rule: string;
  message: string;
}

function validate(): ValidationError[] {
  const errors: ValidationError[] = [];

  const phaseIds = new Set(PHASES.map((p) => p.id));
  const exerciseIds = new Set<string>();
  const slugs = new Set<string>();

  for (const exercise of ALL_EXERCISES) {
    if (exerciseIds.has(exercise.id)) {
      errors.push({ rule: "duplicate-id", message: `Duplicate exercise id: ${exercise.id}` });
    }
    exerciseIds.add(exercise.id);

    if (slugs.has(exercise.slug)) {
      errors.push({ rule: "duplicate-slug", message: `Duplicate exercise slug: ${exercise.slug}` });
    }
    slugs.add(exercise.slug);

    const phaseId = `phase-${exercise.phaseNumber}`;
    if (!phaseIds.has(phaseId)) {
      errors.push({ rule: "invalid-phase-reference", message: `${exercise.id} references unknown phase ${phaseId}` });
    }

    if (exercise.minimumBpm >= exercise.maximumBpm) {
      errors.push({ rule: "invalid-bpm-range", message: `${exercise.id}: minimumBpm must be < maximumBpm` });
    }
    if (exercise.targetBpm < exercise.minimumBpm || exercise.targetBpm > exercise.maximumBpm) {
      errors.push({ rule: "invalid-bpm-range", message: `${exercise.id}: targetBpm must be within [minimumBpm, maximumBpm]` });
    }
    if (exercise.minimumAccuracy < 0 || exercise.minimumAccuracy > 100) {
      errors.push({ rule: "invalid-accuracy", message: `${exercise.id}: minimumAccuracy must be within 0-100` });
    }
    if (exercise.requiredConsecutiveCleanAttempts < 1) {
      errors.push({ rule: "invalid-mastery-criteria", message: `${exercise.id}: requiredConsecutiveCleanAttempts must be >= 1` });
    }
  }

  for (const phase of PHASES) {
    const count = ALL_EXERCISES.filter((e) => e.phaseNumber === phase.number).length;
    if (count < 10) {
      errors.push({ rule: "insufficient-exercises", message: `Phase ${phase.number} has only ${count} exercises (minimum 10)` });
    }
  }

  const pairs = computePrerequisitePairs();
  const adjacency = new Map<string, string[]>();
  for (const { exerciseId, prerequisiteId } of pairs) {
    if (!exerciseIds.has(exerciseId)) {
      errors.push({ rule: "missing-prerequisite-target", message: `Prerequisite references unknown exercise ${exerciseId}` });
    }
    if (!exerciseIds.has(prerequisiteId)) {
      errors.push({ rule: "missing-prerequisite", message: `${exerciseId} has unknown prerequisite ${prerequisiteId}` });
    }
    if (!adjacency.has(exerciseId)) adjacency.set(exerciseId, []);
    adjacency.get(exerciseId)!.push(prerequisiteId);
  }

  // Circular-dependency check via DFS over the "requires" graph.
  const WHITE = 0,
    GRAY = 1,
    BLACK = 2;
  const color = new Map<string, number>();
  for (const id of exerciseIds) color.set(id, WHITE);

  function visit(node: string, path: string[]): void {
    color.set(node, GRAY);
    for (const prereq of adjacency.get(node) ?? []) {
      if (color.get(prereq) === GRAY) {
        errors.push({
          rule: "circular-dependency",
          message: `Circular prerequisite dependency: ${[...path, node, prereq].join(" -> ")}`,
        });
      } else if (color.get(prereq) === WHITE) {
        visit(prereq, [...path, node]);
      }
    }
    color.set(node, BLACK);
  }
  for (const id of exerciseIds) {
    if (color.get(id) === WHITE) visit(id, []);
  }

  return errors;
}

const errors = validate();
if (errors.length > 0) {
  console.error(`Curriculum validation FAILED with ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  [${e.rule}] ${e.message}`);
  process.exit(1);
} else {
  console.log(
    `Curriculum validation PASSED: ${PHASES.length} phases, ${ALL_EXERCISES.length} exercises, ${
      computePrerequisitePairs().length
    } prerequisite edges, no cycles.`
  );
}
