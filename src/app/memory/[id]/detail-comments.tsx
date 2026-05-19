"use client";

import { CommentsInline } from "@/components/comments-inline";

export function MemoryDetailComments(props: {
  memoryId: string;
  initialCount: number;
  currentUserId?: string;
}) {
  return <CommentsInline {...props} expanded />;
}
