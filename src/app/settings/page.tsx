import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { PageHeader } from "@/components/page-header";
import { BackButton } from "@/components/back-button";
import { SettingsForms } from "./forms";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/settings");

  return (
    <>
      <div className="pt-2">
        <BackButton label="Kembali" />
      </div>
      <PageHeader
        eyebrow="pengaturan"
        title="Tentangmu."
        subtitle="Ubah nama, foto, bio, atau kata sandi."
      />
      <SettingsForms
        user={{
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl ?? null,
          bio: user.bio ?? "",
          birthdate: user.birthdate ?? "",
          coupleStartDate: user.coupleStartDate ?? "",
        }}
      />
    </>
  );
}
