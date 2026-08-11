import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Building2,
  Handshake,
  Target,
  Users,
  Activity,
  CheckSquare,
  FileText,
  Package,
  Mail,
  Zap,
  Sparkles,
  BarChart3,
} from "lucide-react";

export type NavIcon = ComponentType<{ size?: number; className?: string }>;

export interface CrmNavItem {
  label: string;
  href: string;
  icon: NavIcon;
  /** not built yet — shown, but leads to a "Soon" page */
  soon?: boolean;
}

export const crmNav: CrmNavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Pipeline", href: "/pipeline", icon: Handshake },
  { label: "Leads", href: "/leads", icon: Target, soon: true },
  { label: "Contacts", href: "/contacts", icon: Users, soon: true },
  { label: "Activities", href: "/activities", icon: Activity, soon: true },
  { label: "Tasks", href: "/tasks", icon: CheckSquare, soon: true },
  { label: "Quotes", href: "/quotes", icon: FileText, soon: true },
  { label: "Products", href: "/products", icon: Package, soon: true },
  { label: "Email", href: "/email", icon: Mail, soon: true },
  { label: "Automations", href: "/automations", icon: Zap, soon: true },
  { label: "AI Sales", href: "/ai-sales", icon: Sparkles, soon: true },
  { label: "Reports", href: "/reports", icon: BarChart3, soon: true },
];
