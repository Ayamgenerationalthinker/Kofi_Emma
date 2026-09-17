// npm run curriculum:validate — statically validates the curriculum content
// defined in src/data/curriculum.ts: duplicate ids/slugs, missing
// prerequisites, circular dependencies, invalid phase references,
// source attributions, and out-of-range BPM/accuracy.

import { PHASES, EXERCISES } from "../src/data/curriculum.ts";

interface ValidationError {
  rule: string;
  message: string;
}

function validate(): ValidationError[] {
  const errors: ValidationError[] = [];

  const phaseIds = new Set(PHASES.map((p) => p.id));
  const exerciseIds = new Set<string>();
  const slugs = new Set<string>();

  for (const exercise of EXERCISES) {
    if (exerciseIds.has(exercise.id)) {
      errors.push({ rule: "duplicate-id", message: `Duplicate exercise id: ${exercise.id}` });
    }
    exerciseIds.add(exercise.id);

    if (slugs.has(exercise.slug)) {
      errors.push({ rule: "duplicate-slug", message: `Duplicate exercise slug: ${exercise.slug}` });
    }
    slugs.add(exercise.slug);

    if (!phaseIds.has(exercise.phaseId)) {
      errors.push({ rule: "invalid-phase-reference", message: `${exercise.id} references unknown phase ${exercise.phaseId}` });
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
    if (!exercise.source || !exercise.source.name) {
      errors.push({ rule: "missing-source-attribution", message: `${exercise.id} is missing source attribution metadata` });
    }
  }

  for (const phase of PHASES) {
    const count = EXERCISES.filter((e) => e.phaseId === phase.id).length;
    if (count === 0) {
      errors.push({ rule: "empty-phase", message: `Phase ${phase.id} (${phase.title}) has 0 exercises` });
    }
  }

  const adjacency = new Map<string, string[]>();
  for (const exercise of EXERCISES) {
    for (const prereqId of exercise.prerequisiteIds) {
      if (!exerciseIds.has(prereqId)) {
        errors.push({ rule: "missing-prerequisite", message: `${exercise.id} has unknown prerequisite ${prereqId}` });
      }
    }
    adjacency.set(exercise.id, exercise.prerequisiteIds);
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
const totalPrereqEdges = EXERCISES.reduce((sum, e) => sum + e.prerequisiteIds.length, 0);

if (errors.length > 0) {
  console.error(`Curriculum validation FAILED with ${errors.length} error(s):\n`);
  for (const e of errors) console.error(`  [${e.rule}] ${e.message}`);
  process.exit(1);
} else {
  console.log(
    `Curriculum validation PASSED: ${PHASES.length} phases, ${EXERCISES.length} exercises, ${totalPrereqEdges} prerequisite edges, verified source attributions, zero cycles.`
  );
}
