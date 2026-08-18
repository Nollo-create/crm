import { NextResponse, type NextRequest } from "next/server";
import { apiGuard } from "@/lib/api/auth";
import { apiJson, parsePaging } from "@/lib/api/respond";
import { listDealsPage } from "@/lib/db";
import { serializeDeal } from "@/lib/api/serialize";

export const dynamic = "force-dynamic";

// GET /api/v1/deals?q&sort&dir&page&limit — read-only, org-scoped.
export async function GET(req: NextRequest) {
  const auth = await apiGuard(req);
  if (auth instanceof NextResponse) return auth;
  const { page, pageSize, q, sortKey, sortDir } = parsePaging(req.nextUrl.searchParams);
  const res = await listDealsPage(auth.organizationId, { q, sortKey, sortDir, page, pageSize });
  return apiJson({ data: res.rows.map(serializeDeal), page: res.page, pageCount: res.pageCount, total: res.total });
}
