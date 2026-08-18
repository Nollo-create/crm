import { Check, Minus } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { can, ROLES, type Permission } from "@/lib/auth/rbac";
import { getRestrictMembersAction } from "@/lib/actions/access-policy";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RestrictMembersToggle } from "./restrict-members-toggle";

export const dynamic = "force-dynamic";

const PERMISSIONS: { key: Permission; label: string }[] = [
  { key: "company:read", label: "View records" },
  { key: "record:write", label: "Create & edit records" },
  { key: "company:delete", label: "Delete companies" },
  { key: "deal:delete", label: "Delete deals" },
  { key: "member:manage", label: "Manage users" },
  { key: "org:manage", label: "Manage the organization" },
];

const ROLE_DESC: Record<string, string> = {
  owner: "Full control, including the organization and other owners.",
  admin: "Manage users and delete records; can't touch owners or org settings.",
  member: "Create and edit records (companies, contacts, deals, tasks…).",
  viewer: "Read-only access to every record — can't create, edit or delete.",
};

export default async function RolesPage() {
  const session = await requireSession();
  if (!can(session.role, "member:manage")) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-muted-foreground">You don&apos;t have access to roles &amp; permissions.</p>
      </div>
    );
  }

  const me = session.role;
  const restrict = await getRestrictMembersAction();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Roles &amp; permissions</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">What each role can do. Assign roles in Users &amp; Teams. <span className="text-muted-foreground/80">Viewer is read-only — enforced on every write, server-side.</span></p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {ROLES.map((r) => (
          <Card key={r} className={cn("p-3", r === me && "border-electric ring-1 ring-electric/30")}>
            <p className="flex items-center gap-1.5 text-sm font-semibold capitalize">
              {r}
              {r === me && <span className="rounded-full bg-electric/12 px-1.5 py-0.5 text-[10px] font-medium text-electric">You</span>}
            </p>
            <p className="mt-1 text-2xs text-muted-foreground">{ROLE_DESC[r]}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead className="border-b border-border bg-card text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Permission</th>
                {ROLES.map((r) => (
                  <th key={r} className={cn("px-3 py-2 text-center font-medium capitalize", r === me && "bg-electric/[0.06] text-electric")}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PERMISSIONS.map((p) => (
                <tr key={p.key}>
                  <td className="px-3 py-2.5">{p.label}</td>
                  {ROLES.map((r) => (
                    <td key={r} className={cn("px-3 py-2.5 text-center", r === me && "bg-electric/[0.06]")}>
                      {can(r, p.key) ? (
                        <Check size={15} className="mx-auto text-emerald" />
                      ) : (
                        <Minus size={15} className="mx-auto text-muted-foreground/40" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {restrict.canManage && (
        <div className="space-y-2 pt-1">
          <div>
            <h2 className="text-sm font-semibold">Record visibility</h2>
            <p className="mt-0.5 text-2xs text-muted-foreground">An optional, stricter policy for the member role. Enforced server-side on every list and write.</p>
          </div>
          <RestrictMembersToggle initialOn={restrict.on} />
        </div>
      )}
    </div>
  );
}
