import { listApiKeysAction } from "@/lib/actions/api-keys";
import { ApiKeysManager } from "./api-keys-manager";

export const dynamic = "force-dynamic";

export default async function ApiSettingsPage() {
  const data = await listApiKeysAction();
  return <ApiKeysManager data={data} />;
}
