// Shared option types + guards for the AI pages. Kept in a pure module (not the
// "use server" actions file, which may only export async functions) so both the
// server actions and the client pages can import them.

export type AnalysisFocus = "general" | "growth" | "risk" | "competitive";
export const isAnalysisFocus = (v: string): v is AnalysisFocus => v === "general" || v === "growth" || v === "risk" || v === "competitive";
export const ANALYSIS_FOCUS: Record<AnalysisFocus, string> = {
  general: "Give a balanced account review. Sections: Health (one line), Opportunities (2 bullets), Risks (2 bullets), Recommended next step (one line).",
  growth: "Focus on expansion. Sections: Fit for growth (one line), Upsell & cross-sell opportunities (3 bullets), What could unlock a bigger deal (2 bullets), Recommended next step (one line).",
  risk: "Focus on retention risk. Sections: Health (one line), Churn & risk signals (3 bullets), How to protect the account (2 bullets), Recommended next step (one line).",
  competitive: "Focus on competitive positioning. Sections: Where we stand (one line), Likely objections or competitors (2 bullets), How to differentiate (2 bullets), Recommended next step (one line).",
};

export type OutreachTone = "warm" | "formal" | "direct";
export type OutreachLength = "short" | "standard";
export type OutreachChannel = "email" | "linkedin";
export const TONE_WORD: Record<OutreachTone, string> = { warm: "warm and friendly", formal: "polished and formal", direct: "brief and direct" };
export const isOutreachTone = (v: string): v is OutreachTone => v === "warm" || v === "formal" || v === "direct";
export const isOutreachLength = (v: string): v is OutreachLength => v === "short" || v === "standard";
export const isOutreachChannel = (v: string): v is OutreachChannel => v === "email" || v === "linkedin";
