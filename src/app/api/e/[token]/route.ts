import { NextResponse } from "next/server";
import { markEmailOpened, addActivity, createNotification } from "@/lib/db";

// Email open-tracking pixel. The recipient's mail client loads this 1x1 image,
// which stamps the open on the send record and (on the first open) logs it to the
// contact/deal timeline. Public + unauthenticated by design; always returns the
// pixel and never errors. NOTE: image proxies (Gmail) and privacy pre-fetch
// (Apple Mail) can trigger this without a real human open — treat it as a signal,
// not proof.

export const dynamic = "force-dynamic";

// 1x1 transparent GIF.
const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

function pixelResponse(): NextResponse {
  return new NextResponse(PIXEL, {
    status: 200,
    headers: {
      "content-type": "image/gif",
      "content-length": String(PIXEL.length),
      "cache-control": "no-store, no-cache, must-revalidate, private",
      pragma: "no-cache",
    },
  });
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token: raw } = await params;
    const token = (raw || "").replace(/\.(png|gif)$/i, "").slice(0, 48);
    if (token) {
      const opened = await markEmailOpened(token).catch(() => null);
      if (opened?.firstOpen) {
        if (opened.companyId) {
          await addActivity(opened.organizationId, {
            companyId: opened.companyId,
            contactId: opened.contactId,
            dealId: opened.dealId,
            type: "email",
            summary: `Opened: ${opened.subject}`,
          }).catch(() => {});
        }
        // Notify the sender that their email was opened.
        const href = opened.contactId ? `/contacts/${opened.contactId}` : opened.companyId ? `/companies/${opened.companyId}` : "/emails";
        await createNotification(opened.organizationId, {
          userEmail: opened.sentBy || null,
          type: "email_open",
          title: `${opened.toEmail} opened “${opened.subject}”`,
          href,
        }).catch(() => {});
      }
    }
  } catch {
    // never fail — always return the pixel
  }
  return pixelResponse();
}
