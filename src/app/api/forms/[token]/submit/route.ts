import { NextResponse } from "next/server";
import { getCaptureFormByToken, createLead, incrementCaptureFormSubmissions, createNotification } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIpFromHeaders } from "@/lib/net/client-ip";

// Public, unauthenticated lead-capture endpoint. Anyone with a form's public
// token may submit — that is the point of a website contact form. Defenses:
//  - honeypot field (`company_url`) silently drops bots,
//  - per-IP and per-token rate limits cap flooding,
//  - the org is derived from the token (no cross-tenant surface),
//  - every field is length-capped before it touches the database.
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

async function readFields(req: Request): Promise<Record<string, string>> {
  const ct = req.headers.get("content-type") || "";
  const out: Record<string, string> = {};
  try {
    if (ct.includes("application/json")) {
      const b = (await req.json()) as Record<string, unknown>;
      for (const [k, v] of Object.entries(b)) out[k] = typeof v === "string" ? v : v == null ? "" : String(v);
    } else {
      const fd = await req.formData();
      for (const [k, v] of fd.entries()) out[k] = typeof v === "string" ? v : "";
    }
  } catch {
    /* malformed body → treat as empty */
  }
  return out;
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params;
  const token = (raw || "").slice(0, 64);

  // Rate limit before any DB work — cheap in-memory guard against floods.
  const ip = clientIpFromHeaders(req.headers);
  const perIp = checkRateLimit(`form:ip:${ip}`, { limit: 8, windowMs: 60_000, blockMs: 10 * 60_000 });
  if (!perIp.ok) return json({ error: "Too many submissions. Please try again later." }, 429);
  const perTok = checkRateLimit(`form:tok:${token}`, { limit: 60, windowMs: 60_000, blockMs: 60_000 });
  if (!perTok.ok) return json({ error: "Too many submissions. Please try again later." }, 429);

  const form = await getCaptureFormByToken(token).catch(() => null);
  if (!form || !form.active) return json({ error: "This form is not available." }, 404);

  const f = await readFields(req);

  // Honeypot: a hidden field real users never fill. Pretend success so bots
  // don't learn they were caught.
  if ((f.company_url || "").trim()) return json({ ok: true });

  const name = (f.name || "").trim().slice(0, 190);
  const email = (f.email || "").trim().slice(0, 190);
  const company = (f.company || "").trim().slice(0, 190);
  const phone = (f.phone || "").trim().slice(0, 60);
  const message = (f.message || "").trim().slice(0, 2000);

  if (!name && !email && !company) return json({ error: "Please enter your name or email." }, 400);
  if (email && !EMAIL_RE.test(email)) return json({ error: "Please enter a valid email address." }, 400);
  if (form.require_company && !company) return json({ error: "Please enter your company." }, 400);

  const leadName = name || company || email;
  const id = await createLead(form.organization_id, {
    name: leadName,
    company,
    email,
    phone,
    source: "web",
    status: "new",
    notes: message,
  }).catch(() => 0);

  if (!id) return json({ error: "Something went wrong. Please try again." }, 500);

  await incrementCaptureFormSubmissions(form.id).catch(() => {});
  if (form.notify) {
    await createNotification(form.organization_id, {
      type: "lead",
      title: `New lead from "${form.name || "your form"}": ${leadName}`,
      href: `/leads/${id}`,
    }).catch(() => {});
  }

  return json({ ok: true });
}
