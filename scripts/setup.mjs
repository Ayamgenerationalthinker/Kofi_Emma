#!/usr/bin/env node
// Cross-platform automated setup. Invoked directly with
// `node scripts/setup.mjs`, or via `npm run setup`, or from setup.sh /
// setup.ps1 for users who prefer a native shell entry point.
//
// There is no database and no backend to configure — this app is a fully
// static client bundle. Setup is just: check Node, install deps, validate
// the bundled curriculum content.
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd: rootDir });
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

step("Validating curriculum content");
run("npm run curriculum:validate");

console.log(`
Setup complete.

Start the app with:
  npm run dev

It will be available at http://localhost:5173

This is a 100% client-side app: all curriculum progress, practice logs,
and settings are stored in your browser's LocalStorage. There is no
database and no backend server to run.
`);
