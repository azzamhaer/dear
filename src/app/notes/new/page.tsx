import { PageHeader } from "@/components/page-header";
import { NoteEditor } from "@/components/note-editor";

export const runtime = "edge";

export default function NewNotePage() {
  return (
    <>
      <PageHeader eyebrow="baru" title="Catatan baru." />
      <NoteEditor />
    </>
  );
}
