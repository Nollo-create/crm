import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Sun,
  MailOpen,
  Mails,
  Clock,
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
  ShieldCheck,
  Plug,
  CreditCard,
  KeyRound,
  MonitorSmartphone,
  Siren,
  Settings,
  FormInput,
  Combine,
  Goal,
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
    items: [
      { label: "My Day", href: "/my-day", icon: Sun },
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
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
      { label: "Duplicates", href: "/duplicates", icon: Combine },
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
      { label: "Bulk Email", href: "/emails/bulk", icon: Mails },
      { label: "Sequences", href: "/emails/sequences", icon: GitBranch },
      { label: "Scheduled", href: "/emails/scheduled", icon: Clock },
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
      { label: "Goals & Quotas", href: "/goals", icon: Goal },
      { label: "Conversion", href: "/analytics/conversion", icon: BarChart3 },
      { label: "Email Report", href: "/analytics/email", icon: MailOpen },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Organization", href: "/settings/org", icon: Building },
      { label: "Users & Teams", href: "/settings/users", icon: Users2 },
      { label: "Roles & Permissions", href: "/settings/roles", icon: Shield },
      { label: "Integrations", href: "/settings/integrations", icon: Plug },
      { label: "Email", href: "/settings/email", icon: Mail },
      { label: "Email Templates", href: "/settings/email-templates", icon: FileText },
      { label: "Lead Capture", href: "/settings/forms", icon: FormInput },
      { label: "Billing", href: "/settings/billing", icon: CreditCard },
      { label: "Security", href: "/settings/security-overview", icon: ShieldCheck },
      { label: "Audit Log", href: "/settings/security", icon: KeyRound },
      { label: "Account Security", href: "/settings/sessions", icon: MonitorSmartphone },
      { label: "API", href: "/settings/api", icon: Settings },
      { label: "Emergency Controls", href: "/settings/emergency", icon: Siren },
    ],
  },
];
