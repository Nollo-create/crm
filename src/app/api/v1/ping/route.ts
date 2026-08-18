import { NextResponse, type NextRequest } from "next/server";
import { apiGuard } from "@/lib/api/auth";
import { apiJson } from "@/lib/api/respond";
import { getOrganization } from "@/lib/db";

export const dynamic = "force-dynamic";

// Whoami / auth check — the simplest way for a client to confirm its key works.
export async function GET(req: NextRequest) {
  const auth = await apiGuard(req);
  if (auth instanceof NextResponse) return auth;
  const org = await getOrganization(auth.organizationId).catch(() => null);
  return apiJson({
    ok: true,
    version: "v1",
    access: "read",
    scopes: auth.scopes,
    organization: { id: auth.organizationId, name: org?.name ?? "" },
  });
}
