// Tag colors — brand palette, deterministic pick so a tag keeps a stable color.
// Class strings are static (full literals) so Tailwind's JIT emits them.

export const TAG_COLORS = ["electric", "royal", "emerald", "warning", "danger"] as const;
export type TagColor = (typeof TAG_COLORS)[number];

export function pickTagColor(name: string): TagColor {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TAG_COLORS[h % TAG_COLORS.length];
}

const TAG_CLASS: Record<string, string> = {
  electric: "bg-electric/15 text-electric",
  royal: "bg-royal/15 text-royal",
  emerald: "bg-emerald/15 text-emerald",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
};
export function tagClass(color: string): string {
  return TAG_CLASS[color] ?? TAG_CLASS.electric;
}
