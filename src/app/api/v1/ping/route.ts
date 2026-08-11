import { type NextRequest } from "next/server";
import { authenticateApiKey } from "@/lib/api/auth";
import { apiJson, unauthorized } from "@/lib/api/respond";
import { getOrganization } from "@/lib/db";

export const dynamic = "force-dynamic";

// Whoami / auth check — the simplest way for a client to confirm its key works.
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) return unauthorized();
  const org = await getOrganization(auth.organizationId).catch(() => null);
  return apiJson({
    ok: true,
    version: "v1",
    scope: "read",
    organization: { id: auth.organizationId, name: org?.name ?? "" },
  });
}
