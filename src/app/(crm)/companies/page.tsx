"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, Loader2, Building2, X } from "lucide-react";
import { listCompaniesAction, createCompanyAction, type Company } from "@/lib/actions/crm";
import { leadScore } from "@/lib/crm/pipeline";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { eur } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  lead: "Lead",
  active: "Active",
  customer: "Customer",
  at_risk: "At risk",
  lost: "Lost",
};
const STATUS_CLS: Record<string, string> = {
  lead: "bg-warning/10 text-warning",
  active: "bg-electric/10 text-electric",
  customer: "bg-emerald/10 text-emerald",
  at_risk: "bg-danger/10 text-danger",
  lost: "bg-secondary text-muted-foreground",
};

const empty = { name: "", industry: "", city: "", website: "", employees: "", annualValue: "", status: "lead", accountManager: "", industryMatch: false };

function score(c: Company): number {
  return leadScore({ hasWebsite: !!c.website, employees: c.employees, industryMatch: c.industryMatch, annualValue: c.annualValue });
}

export default function CompaniesPage() {
  const [all, setAll] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      setAll(await listCompaniesAction());
    } catch {
      setErr("Could not load — is the database connected?");
    }
    setLoading(false);
  }
  useEffect(() => {
    void load();
  }, []);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (s ? all.filter((c) => `${c.name} ${c.industry} ${c.city}`.toLowerCase().includes(s)) : all).sort(
      (a, b) => score(b) - score(a)
    );
  }, [all, q]);

  async function create() {
    if (!form.name.trim()) return;
    setBusy(true);
    const res = await createCompanyAction({
      name: form.name,
      industry: form.industry,
      city: form.city,
      website: form.website,
      employees: form.employees ? Number(form.employees) : null,
      annualValue: form.annualValue ? Number(form.annualValue) : 0,
      status: form.status,
      accountManager: form.accountManager,
      industryMatch: form.industryMatch,
    });
    setBusy(false);
    if (res.error) {
      setErr(res.error);
      return;
    }
    setForm(empty);
    setShowForm(false);
    void load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Companies</h1>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus size={15} /> New company
        </Button>
      </div>

      {showForm && (
        <div className="glass-strong space-y-3 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">New company</p>
            <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Input placeholder="Company name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input placeholder="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
            <Input type="number" placeholder="Employees" value={form.employees} onChange={(e) => setForm({ ...form, employees: e.target.value })} />
            <Input type="number" placeholder="Annual value (€)" value={form.annualValue} onChange={(e) => setForm({ ...form, annualValue: e.target.value })} />
            <Input placeholder="Account manager" value={form.accountManager} onChange={(e) => setForm({ ...form, accountManager: e.target.value })} />
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={form.industryMatch} onChange={(e) => setForm({ ...form, industryMatch: e.target.checked })} className="h-4 w-4 accent-electric" />
              Industry fit
            </label>
          </div>
          {err && <p className="text-xs text-danger">{err}</p>}
          <div className="flex justify-end">
            <Button size="sm" onClick={create} disabled={busy || !form.name.trim()}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Create
            </Button>
          </div>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search companies…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
      </div>

      {loading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="animate-spin" />
        </div>
      ) : shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          {all.length === 0 ? "No companies yet — add your first one." : "No matches."}
        </p>
      ) : (
        <div className="space-y-2">
          {shown.map((c) => {
            const sc = score(c);
            return (
              <Link key={c.id} href={`/companies/${c.id}`} className="glass flex items-center gap-3 rounded-xl p-3.5 hover:border-electric/40">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                  <Building2 size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[c.industry, c.city, c.employees ? `${c.employees} emp.` : ""].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                {c.annualValue > 0 && <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{eur(c.annualValue)}/yr</span>}
                <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium", STATUS_CLS[c.status] ?? STATUS_CLS.lost)}>
                  {STATUS_LABEL[c.status] ?? c.status}
                </span>
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-semibold",
                    sc >= 75 ? "bg-emerald/10 text-emerald" : sc >= 50 ? "bg-warning/10 text-warning" : "bg-secondary text-muted-foreground"
                  )}
                  title="Lead score"
                >
                  {sc}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
