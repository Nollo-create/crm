"use client";

import { useEffect, useState } from "react";
import { GitBranch, X, Loader2, Plus } from "lucide-react";
import { listSequencesAction, listContactEnrollmentsAction, enrollContactAction, stopEnrollmentAction, type SequenceListItem, type ContactEnrollment } from "@/lib/actions/sequences";
import { Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useCanWrite } from "@/components/crm/role-context";

/** On a contact profile: show the sequences this contact is active in (with a
 *  stop control) and let a writer enroll them in another. */
export function ContactSequences({ contactId }: { contactId: number }) {
  const { toast } = useToast();
  const canWrite = useCanWrite();
  const [sequences, setSequences] = useState<SequenceListItem[]>([]);
  const [enrollments, setEnrollments] = useState<ContactEnrollment[]>([]);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);

  function load() {
    Promise.all([listSequencesAction().catch(() => []), listContactEnrollmentsAction(contactId).catch(() => [])])
      .then(([s, e]) => { setSequences(s); setEnrollments(e); })
      .finally(() => setLoaded(true));
  }
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [contactId]);

  async function enroll(sequenceId: string) {
    if (!sequenceId) return;
    setBusy(true);
    const r = await enrollContactAction(Number(sequenceId), contactId);
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    toast("Enrolled in sequence", { tone: "success" });
    load();
  }
  async function stop(id: number) {
    setBusy(true);
    const r = await stopEnrollmentAction(id, contactId);
    setBusy(false);
    if (r.error) return toast(r.error, { tone: "error" });
    load();
  }

  // Nothing to show and can't act → render nothing (keeps the panel clean).
  if (loaded && enrollments.length === 0 && (!canWrite || sequences.length === 0)) return null;

  const enrolledIds = new Set(enrollments.map((e) => e.sequenceId));
  const available = sequences.filter((s) => !enrolledIds.has(s.id) && s.stepCount > 0);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-sm font-semibold"><GitBranch size={15} className="text-electric" /> Sequences</p>

      {enrollments.length > 0 && (
        <div className="mt-2 space-y-1.5">
          {enrollments.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-2.5 py-1.5 text-2xs">
              <span className="min-w-0 truncate"><span className="font-medium">{e.sequenceName}</span> <span className="text-muted-foreground">· step {e.currentStep + 1}</span></span>
              {canWrite && <button onClick={() => stop(e.id)} disabled={busy} title="Stop" className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground hover:text-danger"><X size={13} /></button>}
            </div>
          ))}
        </div>
      )}

      {canWrite && available.length > 0 && (
        <label className="mt-2 flex items-center gap-2 text-2xs text-muted-foreground">
          <Plus size={13} className="shrink-0" />
          <Select defaultValue="" onChange={(e) => { enroll(e.target.value); e.target.value = ""; }} disabled={busy} className="h-8 flex-1 text-xs">
            <option value="">Enroll in a sequence…</option>
            {available.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          {busy && <Loader2 size={13} className="animate-spin" />}
        </label>
      )}
    </div>
  );
}
