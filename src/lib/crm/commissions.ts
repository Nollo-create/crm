// Commission math — pure so it's unit tested and identical server + client.
// Rates are stored in basis points (1000 bp = 10%); revenue is whole euros;
// commission is computed in integer cents.

export function bpToPercent(bp: number): number {
  return (bp || 0) / 100;
}
export function percentToBp(percent: number): number {
  return Math.max(0, Math.round((Number(percent) || 0) * 100));
}

/** Commission in integer cents: revenueEuros * (bp/10000), scaled to cents. */
export function commissionCents(revenueEuros: number, rateBp: number): number {
  return Math.round(((revenueEuros || 0) * (rateBp || 0)) / 100);
}
