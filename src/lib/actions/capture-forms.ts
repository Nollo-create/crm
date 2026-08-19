"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { requireSession, guardWrite } from "@/lib/auth/session";
import { recordAudit } from "@/lib/auth/audit";
import { validated, vString } from "@/lib/crm/validate";
import { publicBaseUrl } from "@/lib/email/mailbox";
import {
  createCaptureForm,
  updateCaptureForm,
  deleteCaptureForm,
  listCaptureForms,
  type CaptureFormRow,
  type CaptureFormInput,
} from "@/lib/db";

export interface CaptureFormView {
  id: number;
  token: string;
  name: string;
  title: string;
  description: string;
  successMessage: string;
  redirectUrl: string;
  requireCompany: boolean;
  notify: boolean;
  active: boolean;
  submissions: number;
  createdAt: string;
}

function toView(r: CaptureFormRow): CaptureFormView {
  return {
    id: r.id,
    token: r.token,
    name: r.name,
    title: r.title,
    description: r.description,
    successMessage: r.success_message,
    redirectUrl: r.redirect_url,
    requireCompany: !!r.require_company,
    notify: !!r.notify,
    active: !!r.active,
    submissions: r.submissions,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

export interface CaptureFormDTO {
  name: string;
  title?: string;
  description?: string;
  successMessage?: string;
  redirectUrl?: string;
  requireCompany?: boolean;
  notify?: boolean;
  active?: boolean;
}

export async function captureFormsAction(): Promise<{ forms: CaptureFormView[]; baseUrl: string }> {
  const { organizationId } = await requireSession();
  const [rows, baseUrl] = await Promise.all([
    listCaptureForms(organizationId).catch(() => []),
    publicBaseUrl().catch(() => ""),
  ]);
  return { forms: rows.map(toView), baseUrl };
}

/** Only http(s) absolute URLs are accepted for the post-submit redirect — this
 *  blocks `javascript:` / `data:` URIs, since the visitor's browser is sent there. */
function cleanRedirect(url: string | undefined): { ok: true; value: string } | { ok: false; error: string } {
  const v = (url ?? "").trim();
  if (!v) return { ok: true, value: "" };
  try {
    const u = new URL(v);
    if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, error: "Redirect URL must start with http:// or https://" };
    return { ok: true, value: u.toString().slice(0, 500) };
  } catch {
    return { ok: false, error: "Redirect URL is not a valid URL." };
  }
}

function build(input: CaptureFormDTO): { ok: true; value: CaptureFormInput } | { ok: false; error: string } {
  const v = validated(() => ({
    name: vString("Name", input.name, { required: true, max: 120 }),
    title: vString("Title", input.title, { max: 200 }),
    description: vString("Description", input.description, { max: 500 }),
    successMessage: vString("Success message", input.successMessage, { max: 500 }),
  }));
  if (!v.ok) return v;
  const rd = cleanRedirect(input.redirectUrl);
  if (!rd.ok) return rd;
  return {
    ok: true,
    value: {
      name: v.value.name,
      title: v.value.title || v.value.name,
      description: v.value.description,
      successMessage: v.value.successMessage || "Thanks — we'll be in touch shortly.",
      redirectUrl: rd.value,
      requireCompany: !!input.requireCompany,
      notify: input.notify !== false,
      active: input.active !== false,
    },
  };
}

export async function createCaptureFormAction(input: CaptureFormDTO): Promise<{ id?: number; error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const b = build(input);
  if (!b.ok) return { error: b.error };
  const token = `frm_${randomBytes(18).toString("base64url")}`;
  const id = await createCaptureForm(g.session.organizationId, token, { ...b.value, createdBy: g.session.email });
  await recordAudit(g.session, "capture_form_create", "capture_form", id, b.value.name);
  revalidatePath("/settings/forms");
  return { id };
}

export async function updateCaptureFormAction(id: number, input: CaptureFormDTO): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  const b = build(input);
  if (!b.ok) return { error: b.error };
  await updateCaptureForm(g.session.organizationId, id, b.value);
  await recordAudit(g.session, "capture_form_update", "capture_form", id, b.value.name);
  revalidatePath("/settings/forms");
  return {};
}

export async function deleteCaptureFormAction(id: number): Promise<{ error?: string }> {
  const g = await guardWrite();
  if ("error" in g) return { error: g.error };
  await deleteCaptureForm(g.session.organizationId, id);
  await recordAudit(g.session, "capture_form_delete", "capture_form", id, "");
  revalidatePath("/settings/forms");
  return {};
}
