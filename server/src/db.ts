import "./env.js";
import { PrismaClient } from "@prisma/client";

// A single shared Prisma client. tsx watch and test runners can both
// re-import this module without opening multiple SQLite connections
// because Node module caching keeps this instance singular per process.
export const prisma = new PrismaClient();
