// Barrel re-export for the storage module (`src/lib/storage/`) so existing
// `import { ... } from "../lib/localDb"` call sites across the app keep
// working unchanged after the section-3 restructuring into
// storage.ts/keys.ts/migrations.ts/types.ts.
export * from "./storage/types";
export * from "./storage/storage";
