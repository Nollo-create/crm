// Dep-free auth constants — safe to import from the Edge middleware (which can't
// load Node's crypto). Everything else re-exports from here.

export const SESSION_COOKIE = "crm_session";
export const SESSION_TTL_DAYS = 30;
