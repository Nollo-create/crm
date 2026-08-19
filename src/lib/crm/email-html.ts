// Render a plain-text email body as safe HTML: entities escaped (so the sender's
// text can't inject markup), line breaks preserved, with an optional 1x1 tracking
// pixel appended. Pure + unit-tested; used by the send pipeline when open
// tracking is on.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildEmailHtml(text: string, pixelUrl?: string): string {
  const safe = escapeHtml(text ?? "").replace(/\r\n/g, "\n").replace(/\n/g, "<br>");
  const pixel = pixelUrl ? `<img src="${escapeHtml(pixelUrl)}" width="1" height="1" alt="" style="display:none">` : "";
  return `<div style="font-family:system-ui,-apple-system,sans-serif;font-size:14px;line-height:1.5">${safe}</div>${pixel}`;
}
