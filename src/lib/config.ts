import "server-only"; // holds INTERNAL_API_SECRET — must never be bundled to the client
// The integration contract — the single switch that makes the CMS "connected to
// Sajtpress" vs "standalone". Everything cross-app reads this. Flip
// SAJTPRESS_INTEGRATION off and the CMS runs entirely on its own (own DB, own
// login, no brain) — which is what keeps it sellable as a separate product.

export interface IntegrationConfig {
  /** master switch: is this CMS connected to the Sajtpress platform? */
  enabled: boolean;
  /** base URL of the webapp's internal API, e.g. https://webapp.sajtpress.rs */
  webappUrl: string;
  /** shared service secret for server-to-server calls (never sent to the browser) */
  secret: string;
  /** parent domain for the shared SSO cookie, e.g. .sajtpress.rs */
  cookieDomain: string;
}

/** Pure — reads the config from a given env, so it's testable. */
export function readIntegration(env: Record<string, string | undefined> = process.env): IntegrationConfig {
  const flag = (env.SAJTPRESS_INTEGRATION ?? "").trim().toLowerCase();
  const enabled = flag === "on" || flag === "1" || flag === "true";
  return {
    enabled,
    webappUrl: (env.WEBAPP_INTERNAL_URL ?? "").trim().replace(/\/+$/, ""),
    secret: (env.INTERNAL_API_SECRET ?? "").trim(),
    cookieDomain: (env.SESSION_COOKIE_DOMAIN ?? "").trim(),
  };
}

/** True only when the integration is switched on AND fully configured, so a
 *  half-set env behaves as standalone rather than erroring. */
export function isConnected(cfg: IntegrationConfig): boolean {
  return cfg.enabled && cfg.webappUrl !== "" && cfg.secret !== "";
}

export const integration = readIntegration();
