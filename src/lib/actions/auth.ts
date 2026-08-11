"use server";

import { redirect } from "next/navigation";
import { countUsers, createOrganization, createUser, getUserByEmail, setUserLastLogin } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { startSession, endSession } from "@/lib/auth/session";

// A dummy hash to verify against when no user matches, so login timing doesn't
// reveal whether an email exists.
const DUMMY_HASH = "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

function slugify(s: string): string {
  return (
    s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 120) || "org"
  );
}
const validEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

/** First-run bootstrap: create the first organization + owner. Allowed only
 *  while the instance has zero users. */
export async function setupAction(input: { orgName: string; name: string; email: string; password: string }): Promise<{ ok?: true; error?: string }> {
  let n: number;
  try {
    n = await countUsers();
  } catch {
    return { error: "Database not reachable — check the server configuration." };
  }
  if (n > 0) return { error: "Setup has already been completed. Please sign in." };

  const orgName = input.orgName.trim();
  const email = input.email.trim().toLowerCase();
  if (!orgName) return { error: "Organization name is required." };
  if (!validEmail(email)) return { error: "Enter a valid email address." };
  if (input.password.length < 8) return { error: "Password must be at least 8 characters." };

  const orgId = await createOrganization(orgName, slugify(orgName));
  const passwordHash = await hashPassword(input.password);
  const userId = await createUser({ organizationId: orgId, email, name: input.name.trim(), passwordHash, role: "owner" });
  await startSession(userId, orgId);
  return { ok: true };
}

export async function loginAction(input: { email: string; password: string }): Promise<{ ok?: true; error?: string }> {
  const email = input.email.trim().toLowerCase();
  let user;
  try {
    user = await getUserByEmail(email);
  } catch {
    return { error: "Database not reachable — check the server configuration." };
  }
  // Always run a verify to keep timing uniform whether or not the user exists.
  const ok = await verifyPassword(input.password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "Invalid email or password." };

  await startSession(user.id, user.organization_id);
  await setUserLastLogin(user.id).catch(() => {});
  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await endSession();
  redirect("/login");
}
