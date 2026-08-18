// Dep-free auth constants — safe to import from the Edge middleware (which can't
// load Node's crypto). Everything else re-exports from here.

export const SESSION_COOKIE = "crm_session";
export const SESSION_TTL_DAYS = 30;

/** Per-session CSRF state for the "Continue with Sajtpress" SSO flow. */
export const SSO_STATE_COOKIE = "crm_sso_state";

/** Short-lived cookie for the MFA step of login (after password, before TOTP). */
export const MFA_COOKIE = "crm_mfa";
export const MFA_CHALLENGE_TTL_MIN = 10;
