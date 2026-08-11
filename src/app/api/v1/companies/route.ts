import { type NextRequest } from "next/server";
import { authenticateApiKey } from "@/lib/api/auth";
import { apiJson, unauthorized, parsePaging } from "@/lib/api/respond";
import { listCompaniesPage } from "@/lib/db";
import { serializeCompany } from "@/lib/api/serialize";

export const dynamic = "force-dynamic";

// GET /api/v1/companies?q&sort&dir&page&limit — read-only, org-scoped.
export async function GET(req: NextRequest) {
  const auth = await authenticateApiKey(req);
  if (!auth) return unauthorized();
  const { page, pageSize, q, sortKey, sortDir } = parsePaging(req.nextUrl.searchParams);
  const res = await listCompaniesPage(auth.organizationId, { q, sortKey, sortDir, page, pageSize });
  return apiJson({ data: res.rows.map(serializeCompany), page: res.page, pageCount: res.pageCount, total: res.total });
}
