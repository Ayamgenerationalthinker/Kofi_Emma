import { prisma } from "../db.js";
import { Errors } from "./errors.js";

// Section 4/59: authentication is intentionally out of scope for the local
// MVP — there is exactly one profile per installation. Every route that
// needs a userId resolves it through here so multi-user support later only
// means swapping this lookup for a session-derived id.

export async function getLocalUser() {
  return prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
}

export async function requireLocalUser() {
  const user = await getLocalUser();
  if (!user) throw Errors.noUser();
  return user;
}
