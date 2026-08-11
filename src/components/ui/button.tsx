import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  default: "bg-electric text-white hover:bg-electric/90",
  outline: "border border-border bg-transparent hover:bg-secondary",
  ghost: "bg-transparent hover:bg-secondary text-foreground",
  danger: "bg-danger text-white hover:bg-danger/90",
};
const SIZES: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs gap-1",
  md: "h-10 px-4 text-sm gap-1.5",
};

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(({ className, variant = "default", size = "md", ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
      VARIANTS[variant],
      SIZES[size],
      className
    )}
    {...props}
  />
));
Button.displayName = "Button";
