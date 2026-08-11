// Pure pagination math for the Companies list. Client-side for now: the table
// sorts by computed columns (lead score, health) that aren't DB columns, so the
// full filtered set is ranked in the browser and then paged here. When auth +
// multi-tenant land (Etapa 2) the fetch seam can move server-side; this shape
// (rows + total + range) is what the UI binds to either way.

export interface Page<T> {
  rows: T[];
  total: number;
  page: number; // 1-based, clamped into range
  pageCount: number;
  from: number; // 1-based index of the first row (0 when empty)
  to: number; // 1-based index of the last row (0 when empty)
}

export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const size = Math.max(1, Math.floor(pageSize));
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const clamped = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
  const start = (clamped - 1) * size;
  const rows = items.slice(start, start + size);
  return {
    rows,
    total,
    page: clamped,
    pageCount,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + size, total),
  };
}
