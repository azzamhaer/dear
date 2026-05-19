import { CalendarView } from "@/components/calendar-view";
import { PageHeader } from "@/components/page-header";

export const runtime = "edge";

export default function CalendarPage() {
  const wibNow = new Date(Date.now() + 7 * 3600 * 1000);
  return (
    <>
      <PageHeader
        eyebrow="kalender"
        title="Hari demi hari yang kita simpan."
        subtitle="Pilih tanggal untuk kembali ke sana."
      />
      <CalendarView
        initialYear={wibNow.getUTCFullYear()}
        initialMonth={wibNow.getUTCMonth() + 1}
      />
    </>
  );
}
