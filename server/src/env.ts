import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

// The server package runs with its own directory as cwd, but the single
// .env file for the whole project lives at the repo root so both the
// Prisma CLI (invoked from the root) and the server agree on one source
// of truth for DATABASE_URL.
const rootEnvPath = path.resolve(process.cwd(), "../.env");
const localEnvPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
} else {
  dotenv.config();
}

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
  defaultTimezone: process.env.DEFAULT_TIMEZONE ?? "Africa/Accra",
  databaseUrl: required("DATABASE_URL", "file:./dev.db"),
};

// Prisma reads DATABASE_URL relative to the schema file (prisma/schema.prisma
// at the repo root), so make sure it is set before @prisma/client initializes,
// regardless of which directory the process was launched from.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = env.databaseUrl;
}
