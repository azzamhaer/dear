import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { detectKind, putMedia } from "@/lib/r2";

export const runtime = "edge";

const MAX_BYTES = 50 * 1024 * 1024; // 50MB per file

interface UploadedItem {
  r2Key: string;
  kind: "image" | "video";
  mimeType: string;
  bytes: number;
  name: string;
}

export async function POST(req: NextRequest) {
  try {
    await requireUser();
  } catch (r) {
    return r as Response;
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "invalid_form" },
      { status: 400 },
    );
  }

  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "no_files" }, { status: 400 });
  }

  const out: UploadedItem[] = [];
  for (const file of files) {
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "file_too_large", name: file.name, max: MAX_BYTES },
        { status: 413 },
      );
    }
    const kind = detectKind(file.type);
    if (!kind) {
      return NextResponse.json(
        { error: "unsupported_type", name: file.name, type: file.type },
        { status: 415 },
      );
    }
    const result = await putMedia(file, file.type);
    out.push({
      r2Key: result.key,
      kind,
      mimeType: result.mimeType,
      bytes: result.size,
      name: file.name,
    });
  }

  return NextResponse.json({ uploaded: out });
}
