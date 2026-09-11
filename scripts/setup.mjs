#!/usr/bin/env node
// Cross-platform automated setup (section 69). Invoked directly with
// `node scripts/setup.mjs`, or via `npm run setup`, or from setup.sh /
// setup.ps1 for users who prefer a native shell entry point.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, opts = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: rootDir, ...opts });
}

function step(title) {
  console.log(`\n=== ${title} ===`);
}

step("Checking Node.js version");
const [major] = process.versions.node.split(".").map(Number);
if (major < 18) {
  console.error(`Node.js 18+ is required. Detected ${process.version}.`);
  process.exit(1);
}
console.log(`Node.js ${process.version} OK.`);

step("Installing dependencies");
run("npm install");

step("Checking environment file");
const envPath = path.join(rootDir, ".env");
const envExamplePath = path.join(rootDir, ".env.example");
if (fs.existsSync(envPath)) {
  console.log(".env already exists — leaving it untouched.");
} else {
  fs.copyFileSync(envExamplePath, envPath);
  console.log("Created .env from .env.example.");
}

step("Generating Prisma client");
run("npm run db:generate");

step("Running database migrations");
run("npm run db:migrate -- --name init");

step("Validating curriculum content");
run("npm run curriculum:validate");

step("Seeding the database");
run("npm run db:seed");

console.log(`
Setup complete.

Start the app with:
  npm run dev

Frontend: http://localhost:5173
Backend:  http://localhost:4000
Health:   http://localhost:4000/api/health
`);
