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
        eyebrow="pengaturan"
        title="Tentangmu."
        subtitle="Ubah nama, foto, atau kata sandi sesukamu."
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
