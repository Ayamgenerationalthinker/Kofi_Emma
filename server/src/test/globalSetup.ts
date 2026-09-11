import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Runs once before the whole test suite: creates a fresh SQLite file and
// applies the real Prisma migrations to it, so integration tests exercise
// the same schema the app ships with instead of a hand-rolled fixture DB.
export default async function globalSetup() {
  const schemaPath = path.resolve(process.cwd(), "../prisma/schema.prisma");
  const testDbPath = path.resolve(process.cwd(), "../prisma/test.db");

  for (const p of [testDbPath, `${testDbPath}-journal`]) {
    if (fs.existsSync(p)) fs.rmSync(p);
  }

  execSync(`npx prisma migrate deploy --schema="${schemaPath}"`, {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "inherit",
  });
}
