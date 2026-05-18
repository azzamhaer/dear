// Small wrapper so routes don't all import private hydrate fn.
import type { Memory } from "@/db/schema";
import type { MemoryWithRelations } from "./queries";
import { getMemory } from "./queries";

export async function hydrateForRoute(
  rows: Memory[],
): Promise<MemoryWithRelations[]> {
  // Reuse getMemory for simplicity — perf is fine since On This Day is small.
  const out: MemoryWithRelations[] = [];
  for (const r of rows) {
    const full = await getMemory(r.id);
    if (full) out.push(full);
  }
  return out;
}
