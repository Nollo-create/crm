import { type NextRequest } from "next/server";
import { authenticateApiKey } from "@/lib/api/auth";
import { apiJson, unauthorized, parsePaging } from "@/lib/api/respond";
import { listDealsPage } from "@/lib/db";
import { serializeDeal } from "@/lib/api/serialize";

export const dynamic = "force-dynamic";

// GET /api/v1/deals?q&sort&dir&page&limit — read-only, org-scoped.
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) return unauthorized();
  const { page, pageSize, q, sortKey, sortDir } = parsePaging(req.nextUrl.searchParams);
  const res = await listDealsPage(auth.organizationId, { q, sortKey, sortDir, page, pageSize });
  return apiJson({ data: res.rows.map(serializeDeal), page: res.page, pageCount: res.pageCount, total: res.total });
}
