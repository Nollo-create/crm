// A REAL, explainable security score — never a decorative number (master-prompt
// §62, §77). Every deduction is a measured control with a reason and a fix link.
// Pure so it's unit-tested; the metrics come from the data layer.
//
// Deliberately scores only SHIPPED, measurable controls. MFA isn't built yet, so
// it is NOT scored here (penalizing for an unshipped feature would be misleading);
// it's surfaced separately as "coming soon" and folded into the score in Phase 4.

export interface SecurityMetrics {
  activeSessions: number;
  staleSessions: number; // active but idle 30+ days
  failedLogins24h: number;
  users: number;
  admins: number;
  apiKeysEnabled: number;
  apiKeysIdle: number; // enabled but unused 90+ days
}

export type Severity = "high" | "medium" | "low";

export interface Finding {
  severity: Severity;
  title: string;
  detail: string;
  href?: string;
}

export interface SecurityScore {
  score: number; // 0–100
  grade: "strong" | "fair" | "at-risk";
  findings: Finding[];
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function computeSecurityScore(m: SecurityMetrics): SecurityScore {
  const findings: Finding[] = [];
  let score = 100;

  if (m.failedLogins24h >= 10) {
    findings.push({
      severity: "high",
      title: `${m.failedLogins24h} failed sign-ins in the last 24h`,
      detail: "Could be brute-force or credential stuffing. Review the audit log and confirm the accounts are safe.",
      href: "/settings/security",
    });
    score -= 20;
  } else if (m.failedLogins24h >= 3) {
    findings.push({
      severity: "medium",
      title: `${m.failedLogins24h} failed sign-ins in the last 24h`,
      detail: "A few failed attempts. Usually a mistyped password — worth a glance at the audit log.",
      href: "/settings/security",
    });
    score -= 8;
  }

  if (m.staleSessions > 0) {
    findings.push({
      severity: "medium",
      title: `${m.staleSessions} stale session${m.staleSessions === 1 ? "" : "s"}`,
      detail: "Sessions still active after 30+ days idle. Revoke any device you don't recognize.",
      href: "/settings/sessions",
    });
    score -= clamp(m.staleSessions * 3, 0, 15);
  }

  if (m.apiKeysIdle > 0) {
    findings.push({
      severity: "medium",
      title: `${m.apiKeysIdle} idle API key${m.apiKeysIdle === 1 ? "" : "s"}`,
      detail: "Enabled keys unused for 90+ days widen the attack surface. Revoke the ones you don't need.",
      href: "/settings/api",
    });
    score -= clamp(m.apiKeysIdle * 5, 0, 15);
  }

  score = clamp(Math.round(score), 0, 100);
  const grade: SecurityScore["grade"] = score >= 85 ? "strong" : score >= 65 ? "fair" : "at-risk";
  return { score, grade, findings };
}
