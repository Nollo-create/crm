import { getEmailSettingsAction } from "@/lib/actions/email";
import { EmailForm } from "./email-form";

export const dynamic = "force-dynamic";

export default async function EmailSettingsPage() {
  const data = await getEmailSettingsAction();
  if (!data) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <p className="text-sm text-muted-foreground">Only an owner can configure the sending mailbox.</p>
      </div>
    );
  }
  return <EmailForm data={data} />;
}
