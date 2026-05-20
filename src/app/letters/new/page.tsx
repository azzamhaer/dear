import { PageHeader } from "@/components/page-header";
import { BackButton } from "@/components/back-button";
import { NewLetterForm } from "./form";

export const runtime = "edge";

export default function NewLetterPage() {
  return (
    <>
      <div className="pt-2">
        <BackButton href="/letters" label="Surat" />
      </div>
      <PageHeader
        eyebrow="surat masa depan"
        title="Tuliskan untuk nanti."
        subtitle="Pilih tanggal kapan surat ini boleh dibuka. Sampai harinya tiba, isinya hanya milikmu."
      />
      <NewLetterForm />
    </>
  );
}
