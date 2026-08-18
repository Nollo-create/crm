import { describe, it, expect } from "vitest";
import { computeSecurityScore, type SecurityMetrics } from "./security-score";

const clean: SecurityMetrics = {
  activeSessions: 2,
  staleSessions: 0,
  failedLogins24h: 0,
  users: 3,
  admins: 1,
  adminsWithoutMfa: 0,
  apiKeysEnabled: 1,
  apiKeysIdle: 0,
};

describe("computeSecurityScore", () => {
  it("a clean workspace scores 100 / strong with no findings", () => {
    const r = computeSecurityScore(clean);
    expect(r.score).toBe(100);
    expect(r.grade).toBe("strong");
    expect(r.findings).toHaveLength(0);
  });

  it("admins without two-factor is the heaviest, high-severity factor", () => {
    const r = computeSecurityScore({ ...clean, adminsWithoutMfa: 2 });
    expect(r.score).toBe(76); // -12 * 2
    expect(r.findings[0].severity).toBe("high");
    expect(r.findings[0].title).toContain("two-factor");
  });

  it("a failed-login spike is a high finding and drops the score", () => {
    const r = computeSecurityScore({ ...clean, failedLogins24h: 12 });
    expect(r.score).toBe(80);
    expect(r.findings[0].severity).toBe("high");
  });

  it("stale sessions and idle keys each deduct, capped", () => {
    const r = computeSecurityScore({ ...clean, staleSessions: 10, apiKeysIdle: 10 });
    // both caps hit: -15 -15 = -30
    expect(r.score).toBe(70);
    expect(r.findings.map((f) => f.severity)).toEqual(["medium", "medium"]);
  });

  it("never goes below 0 and grades at-risk", () => {
    const r = computeSecurityScore({ ...clean, failedLogins24h: 50, staleSessions: 50, apiKeysIdle: 50 });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.grade).toBe("at-risk");
  });

  it("every finding carries a reason and a fix link", () => {
    const r = computeSecurityScore({ ...clean, failedLogins24h: 4, staleSessions: 1, apiKeysIdle: 1 });
    for (const f of r.findings) {
      expect(f.detail.length).toBeGreaterThan(10);
      expect(f.href).toBeTruthy();
    }
  });
});
