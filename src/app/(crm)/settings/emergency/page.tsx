import { emergencyStatusAction } from "@/lib/actions/emergency";
import { EmergencyControls } from "./emergency-controls";

export const dynamic = "force-dynamic";

export default async function EmergencyPage() {
  const data = await emergencyStatusAction();
  if (!data) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-muted-foreground">Only an owner can access emergency controls.</p>
      </div>
    );
  }
  return <EmergencyControls initial={data} />;
}
