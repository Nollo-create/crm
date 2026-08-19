import { getCaptureFormByToken } from "@/lib/db";
import { CaptureForm } from "./capture-form";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { token } = await params;
  const { embed } = await searchParams;
  const form = await getCaptureFormByToken((token || "").slice(0, 64)).catch(() => null);
  const isEmbed = embed === "1";

  if (!form || !form.active) {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <p className="text-sm text-muted-foreground">This form is no longer available.</p>
      </main>
    );
  }

  return (
    <main className={isEmbed ? "p-3" : "grid min-h-screen place-items-center bg-secondary/30 p-6"}>
      <CaptureForm
        token={form.token}
        title={form.title}
        description={form.description}
        requireCompany={!!form.require_company}
        successMessage={form.success_message}
        redirectUrl={form.redirect_url}
        embed={isEmbed}
      />
    </main>
  );
}
