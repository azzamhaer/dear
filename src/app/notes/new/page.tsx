import { PageHeader } from "@/components/page-header";
import { NoteEditor } from "@/components/note-editor";

export const runtime = "edge";

export default function NewNotePage() {
  return (
    <>
      <PageHeader eyebrow="new" title="A new note." />
      <NoteEditor />
    </>
  );
}
