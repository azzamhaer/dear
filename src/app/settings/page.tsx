import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { SettingsForms } from "./forms";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/settings");

  return (
    <>
      <PageHeader
        eyebrow="settings"
        title="Yours."
        subtitle="Change your name, your photo, or your password."
      />
      <SettingsForms
        user={{
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl ?? null,
        }}
      />
    </>
  );
}
