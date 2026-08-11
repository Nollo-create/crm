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
      { label: "Contacts", href: "/contacts", icon: Users, soon: true },
      { label: "Leads", href: "/leads", icon: Target, soon: true },
      { label: "Deals", href: "/deals", icon: Handshake, soon: true },
      { label: "Customers", href: "/customers", icon: UserCheck, soon: true },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Activities", href: "/activities", icon: Activity, soon: true },
      { label: "Tasks", href: "/tasks", icon: CheckSquare, soon: true },
      { label: "Meetings", href: "/meetings", icon: CalendarDays, soon: true },
      { label: "Calls", href: "/calls", icon: Phone, soon: true },
      { label: "Emails", href: "/emails", icon: Mail, soon: true },
      { label: "Quotes", href: "/quotes", icon: FileText, soon: true },
      { label: "Products", href: "/products", icon: Package, soon: true },
    ],
  },
  {
    title: "AI",
    items: [
      { label: "AI Sales Assistant", href: "/ai/assistant", icon: Sparkles, soon: true },
      { label: "Lead Scoring", href: "/ai/scoring", icon: Star, soon: true },
      { label: "Company Analysis", href: "/ai/company", icon: ScanSearch, soon: true },
      { label: "Next Best Action", href: "/ai/next-action", icon: Compass, soon: true },
      { label: "Sales Insights", href: "/ai/insights", icon: Lightbulb, soon: true },
      { label: "AI Outreach", href: "/ai/outreach", icon: Send, soon: true },
    ],
  },
  {
    title: "Automation",
    items: [
      { label: "Workflows", href: "/automation/workflows", icon: Workflow, soon: true },
      { label: "Follow-ups", href: "/automation/followups", icon: Repeat, soon: true },
      { label: "Lead Routing", href: "/automation/routing", icon: Route, soon: true },
      { label: "Notifications", href: "/automation/notifications", icon: Bell, soon: true },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Sales Dashboard", href: "/analytics/sales", icon: BarChart3, soon: true },
      { label: "Pipeline Analytics", href: "/analytics/pipeline", icon: PieChart, soon: true },
      { label: "Revenue Forecast", href: "/analytics/forecast", icon: TrendingUp, soon: true },
      { label: "Team Performance", href: "/analytics/team", icon: Users2, soon: true },
      { label: "Conversion", href: "/analytics/conversion", icon: BarChart3, soon: true },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Organization", href: "/settings/org", icon: Building, soon: true },
      { label: "Users & Teams", href: "/settings/users", icon: Users2, soon: true },
      { label: "Roles & Permissions", href: "/settings/roles", icon: Shield, soon: true },
      { label: "Integrations", href: "/settings/integrations", icon: Plug, soon: true },
      { label: "Billing", href: "/settings/billing", icon: CreditCard, soon: true },
      { label: "Security", href: "/settings/security", icon: KeyRound, soon: true },
      { label: "API", href: "/settings/api", icon: Settings, soon: true },
    ],
  },
];
