import { listMemories } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { MemoryFeed } from "@/components/memory-feed";
import { PageHeader } from "@/components/page-header";
import { OnThisDayStrip } from "@/components/on-this-day-strip";
import { AffectionStrip } from "@/components/affection-strip";
import { PolaroidEmpty } from "@/components/illustrations";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function HomePage() {
  const [user, memories] = await Promise.all([
    getCurrentUser(),
    listMemories({ limit: PAGE_SIZE }),
  ]);

  const greeting = pickGreeting();
  const firstName = user?.displayName.split(" ")[0] ?? "sayang";

  return (
    <>
      <PageHeader
        eyebrow={greeting}
        title={`Hai, ${firstName}.`}
        subtitle="Semua yang terlalu berharga untuk diucapkan, kita titipkan di sini."
      />

      <AffectionStrip />

      <OnThisDayStrip />

      <MemoryFeed
        initial={memories}
        currentUserId={user?.id}
        pageSize={PAGE_SIZE}
        emptyIllustration={<PolaroidEmpty />}
        emptyTitle="Mulai dari sini."
        emptyDescription="Upload sebuah foto, karena sejatinya one photo worth than a thousand words."
        emptyCta={{ href: "/upload", label: "Simpan yang pertama" }}
      />
    </>
  );
}

function pickGreeting(): string {
  const h = new Date(Date.now() + 7 * 3600 * 1000).getUTCHours();
  if (h < 5) return "masih bangun?";
  if (h < 11) return "selamat pagi";
  if (h < 15) return "selamat siang";
  if (h < 19) return "selamat sore";
  return "selamat malam";
}
