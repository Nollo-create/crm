import { type NextRequest } from "next/server";
import { authenticateApiKey } from "@/lib/api/auth";
import { apiJson, unauthorized, parsePaging } from "@/lib/api/respond";
import { listContactsPage } from "@/lib/db";
import { serializeContact } from "@/lib/api/serialize";

export const dynamic = "force-dynamic";

// GET /api/v1/contacts?q&sort&dir&page&limit — read-only, org-scoped.
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) return unauthorized();
  const { page, pageSize, q, sortKey, sortDir } = parsePaging(req.nextUrl.searchParams);
  const res = await listContactsPage(auth.organizationId, { q, sortKey, sortDir, page, pageSize });
  return apiJson({ data: res.rows.map(serializeContact), page: res.page, pageCount: res.pageCount, total: res.total });
}
