"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Loader2, UserPlus, Search } from "lucide-react";
import { listUsersAction, inviteUserAction, setUserRoleAction, setUserStatusAction, type OrgUser } from "@/lib/actions/users";
import { Card } from "@/components/ui/card";
import { Badge, type Tone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = { owner: "Owner", admin: "Admin", member: "Member" };
const roleTone = (r: string): Tone => (r === "owner" ? "royal" : r === "admin" ? "electric" : "neutral");

export function UsersManager({ currentUserId, currentRole }: { currentUserId: number; currentRole: string }) {
  const { toast } = useToast();
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "member", password: "" });
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter(
      (u) =>
        (roleFilter === "all" || u.role === roleFilter) &&
        (statusFilter === "all" || u.status === statusFilter) &&
        (!needle || (u.name || "").toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle))
    );
  }, [users, q, roleFilter, statusFilter]);
  const activeCount = useMemo(() => users.filter((u) => u.status === "active").length, [users]);

  async function load() {
    setLoading(true);
    setUsers(await listUsersAction().catch(() => []));
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  const roleOptions = currentRole === "owner" ? ["owner", "admin", "member"] : ["admin", "member"];

  async function invite() {
    setBusy(true);
    const r = await inviteUserAction(form);
    setBusy(false);
    if (r.error) {
      toast(r.error, { tone: "error" });
      return;
    }
    toast(`${form.email} added`, { tone: "success" });
    setForm({ name: "", email: "", role: "member", password: "" });
    setShowAdd(false);
    void load();
  }
  async function changeRole(u: OrgUser, role: string) {
    const r = await setUserRoleAction(u.id, role);
    if (r.error) toast(r.error, { tone: "error" });
    else toast(`${u.email} is now ${ROLE_LABEL[role] ?? role}`, { tone: "success" });
    void load();
  }
  async function toggleStatus(u: OrgUser) {
    const next = u.status === "active" ? "disabled" : "active";
    const r = await setUserStatusAction(u.id, next);
    if (r.error) {
      toast(r.error, { tone: "error" });
      return;
    }
    toast(`${u.email} ${next === "active" ? "reactivated" : "disabled"}`, { tone: "success" });
    void load();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Users &amp; Teams</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Manage who can access this workspace.</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
          <UserPlus size={15} /> Add user
        </Button>
      </div>

      {showAdd && (
        <Card className="space-y-3 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {roleOptions.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </Select>
            <Input type="password" placeholder="Temporary password (min 8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" />
          </div>
          <p className="text-2xs text-muted-foreground">No email is sent yet — share the temporary password with them directly.</p>
          <div className="flex justify-end">
            <Button size="sm" disabled={busy || !form.email || form.password.length < 8} onClick={invite}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create user
            </Button>
          </div>
        </Card>
      )}

      {!loading && users.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[160px] flex-1 sm:max-w-xs">
            <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search users…" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 pl-8" />
          </div>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-9 w-auto text-xs">
            <option value="all">All roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 w-auto text-xs">
            <option value="all">Any status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </Select>
          <span className="ml-auto text-2xs text-muted-foreground">{users.length} user{users.length === 1 ? "" : "s"} · {activeCount} active</span>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-card text-2xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">User</th>
                <th className="px-3 py-2 text-left font-medium">Role</th>
                <th className="px-3 py-2 text-left font-medium">Status</th>
                <th className="px-3 py-2 text-right font-medium">Last login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-3 py-3" colSpan={4}><Skeleton className="h-4 w-full" /></td>
                  </tr>
                ))
              ) : shown.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-12 text-center text-sm text-muted-foreground">No users match these filters.</td>
                </tr>
              ) : (
                shown.map((u) => {
                  const self = u.id === currentUserId;
                  const canManageThis = currentRole === "owner" || u.role !== "owner";
                  return (
                    <tr key={u.id} className={cn(u.status === "disabled" && "opacity-55")}>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-royal/15 text-xs font-semibold text-royal">
                            {(u.name || u.email).slice(0, 1).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium">
                              {u.name || "—"} {self && <span className="text-2xs font-normal text-muted-foreground">(you)</span>}
                            </p>
                            <p className="truncate text-2xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {self || !canManageThis ? (
                          <Badge tone={roleTone(u.role)}>{ROLE_LABEL[u.role] ?? u.role}</Badge>
                        ) : (
                          <Select value={u.role} onChange={(e) => changeRole(u, e.target.value)} className="h-8 w-auto text-xs">
                            {roleOptions.map((r) => (
                              <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                            ))}
                          </Select>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={u.status === "active" ? "emerald" : "neutral"}>{u.status === "active" ? "Active" : "Disabled"}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right text-2xs text-muted-foreground">
                        <div className="flex items-center justify-end gap-2">
                          <span>{u.lastLoginAt ? timeAgo(u.lastLoginAt) : "never"}</span>
                          {!self && canManageThis && (
                            <Button size="sm" variant="ghost" onClick={() => toggleStatus(u)}>
                              {u.status === "active" ? "Disable" : "Enable"}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
