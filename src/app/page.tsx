import { listMemories } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { MemoryFeed } from "@/components/memory-feed";
import { PageHeader } from "@/components/page-header";
import { OnThisDayStrip } from "@/components/on-this-day-strip";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [user, memories] = await Promise.all([
    getCurrentUser(),
    listMemories({ limit: 30 }),
  ]);

  const greeting = pickGreeting();

  return (
    <>
      <PageHeader
        eyebrow={greeting}
        title={user ? `Hi, ${user.displayName.split(" ")[0]}.` : "Hi."}
        subtitle="Everything you two have saved, in one quiet feed."
      />

      <OnThisDayStrip />

      <MemoryFeed
        initial={memories}
        currentUserId={user?.id}
        emptyTitle="Your first memory awaits."
        emptyDescription="Upload a photo or a little video — write a few words. That's all it takes."
        emptyCta={{ href: "/upload", label: "Add a memory" }}
      />
    </>
  );
}

function pickGreeting(): string {
  // WIB hour-of-day
  const h = new Date(Date.now() + 7 * 3600 * 1000).getUTCHours();
  if (h < 5) return "still up";
  if (h < 11) return "good morning";
  if (h < 17) return "good afternoon";
  if (h < 21) return "good evening";
  return "good night";
}
