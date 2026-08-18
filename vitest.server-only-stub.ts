// Test-only stub. `server-only` throws when imported outside a React Server
// Component; vitest aliases it here so pure modules that (correctly) carry the
// guard can still be unit-tested. App-side protection is unchanged — this alias
// exists only under vitest.
export {};
