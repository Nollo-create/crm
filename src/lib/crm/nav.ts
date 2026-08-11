import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Target,
  Handshake,
  GitBranch,
  UserCheck,
  Activity,
  CheckSquare,
  CalendarDays,
  Phone,
  Mail,
  FileText,
  Package,
  Sparkles,
  Star,
  ScanSearch,
  Compass,
  Lightbulb,
  Send,
  Workflow,
  Repeat,
  Route,
  Bell,
  BarChart3,
  TrendingUp,
  Users2,
  PieChart,
  Building,
  Shield,
  Plug,
  CreditCard,
  KeyRound,
  Settings,
} from "lucide-react";

export type NavIcon = ComponentType<{ size?: number; className?: string }>;

export interface CrmNavItem {
  label: string;
  href: string;
  icon: NavIcon;
  /** not built yet — shown as a map of the product, leads nowhere until built */
  soon?: boolean;
}

export interface CrmNavGroup {
  title?: string;
  items: CrmNavItem[];
}

// The full Sajtpress CRM product map (from the master spec). What's live has a
// real href; everything else is badged `soon` so the structure is visible while
// it's built out phase by phase.
export const crmNav: CrmNavGroup[] = [
  {
    items: [{ label: "Dashboard", href: "/", icon: LayoutDashboard }],
  },
  {
    title: "CRM",
    items: [
      { label: "Companies", href: "/companies", icon: Building2 },
      { label: "Pipeline", href: "/pipeline", icon: GitBranch },
      { label: "Contacts", href: "/contacts", icon: Users },
      { label: "Leads", href: "/leads", icon: Target },
      { label: "Deals", href: "/deals", icon: Handshake },
      { label: "Customers", href: "/customers", icon: UserCheck },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Activities", href: "/activities", icon: Activity },
      { label: "Tasks", href: "/tasks", icon: CheckSquare },
      { label: "Meetings", href: "/meetings", icon: CalendarDays },
      { label: "Calls", href: "/calls", icon: Phone },
      { label: "Emails", href: "/emails", icon: Mail },
      { label: "Quotes", href: "/quotes", icon: FileText },
      { label: "Products", href: "/products", icon: Package },
    ],
  },
  {
    title: "AI",
    items: [
      { label: "AI Sales Assistant", href: "/ai/assistant", icon: Sparkles },
      { label: "Lead Scoring", href: "/ai/scoring", icon: Star },
      { label: "Company Analysis", href: "/ai/company", icon: ScanSearch },
      { label: "Next Best Action", href: "/ai/next-action", icon: Compass },
      { label: "Sales Insights", href: "/ai/insights", icon: Lightbulb },
      { label: "AI Outreach", href: "/ai/outreach", icon: Send },
    ],
  },
  {
    title: "Automation",
    items: [
      { label: "Workflows", href: "/automation/workflows", icon: Workflow },
      { label: "Follow-ups", href: "/automation/followups", icon: Repeat },
      { label: "Lead Routing", href: "/automation/routing", icon: Route },
      { label: "Notifications", href: "/automation/notifications", icon: Bell },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Sales Dashboard", href: "/analytics/sales", icon: BarChart3 },
      { label: "Pipeline Analytics", href: "/analytics/pipeline", icon: PieChart },
      { label: "Revenue Forecast", href: "/analytics/forecast", icon: TrendingUp },
      { label: "Team Performance", href: "/analytics/team", icon: Users2 },
      { label: "Conversion", href: "/analytics/conversion", icon: BarChart3 },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Organization", href: "/settings/org", icon: Building },
      { label: "Users & Teams", href: "/settings/users", icon: Users2 },
      { label: "Roles & Permissions", href: "/settings/roles", icon: Shield },
      { label: "Integrations", href: "/settings/integrations", icon: Plug },
      { label: "Billing", href: "/settings/billing", icon: CreditCard },
      { label: "Security", href: "/settings/security", icon: KeyRound },
      { label: "API", href: "/settings/api", icon: Settings, soon: true },
    ],
  },
];
