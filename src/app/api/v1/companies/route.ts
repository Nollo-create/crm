import { NextResponse, type NextRequest } from "next/server";
import { apiGuard } from "@/lib/api/auth";
import { apiJson, parsePaging } from "@/lib/api/respond";
import { listCompaniesPage } from "@/lib/db";
import { serializeCompany } from "@/lib/api/serialize";

export const dynamic = "force-dynamic";

// GET /api/v1/companies?q&sort&dir&page&limit — read-only, org-scoped.
export async function GET(req: NextRequest) {
  const auth = await apiGuard(req);
  if (auth instanceof NextResponse) return auth;
  const { page, pageSize, q, sortKey, sortDir } = parsePaging(req.nextUrl.searchParams);
  const res = await listCompaniesPage(auth.organizationId, { q, sortKey, sortDir, page, pageSize });
  return apiJson({ data: res.rows.map(serializeCompany), page: res.page, pageCount: res.pageCount, total: res.total });
}
