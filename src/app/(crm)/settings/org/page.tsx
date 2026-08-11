import { orgSettingsAction } from "@/lib/actions/settings";
import { OrgForm } from "./org-form";

export const dynamic = "force-dynamic";

export default async function OrgPage() {
  const data = await orgSettingsAction();
  if (!data) {
    return <p className="py-16 text-center text-sm text-muted-foreground">Could not load the organization.</p>;
  }
  return <OrgForm data={data} />;
}
