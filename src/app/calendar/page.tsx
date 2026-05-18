import { CalendarView } from "@/components/calendar-view";
import { PageHeader } from "@/components/page-header";

export const runtime = "edge";

export default function CalendarPage() {
  const now = new Date();
  return (
    <>
      <PageHeader
        eyebrow="calendar"
        title="Every day we've kept."
        subtitle="Pick a date to revisit it."
      />
      <CalendarView
        initialYear={now.getUTCFullYear()}
        initialMonth={now.getUTCMonth() + 1}
      />
    </>
  );
}
