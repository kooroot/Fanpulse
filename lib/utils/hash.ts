import { stableJson } from "@/lib/utils/stable-json";

export function hashInput(input: unknown): string {
  const text = stableJson(input);
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `fp_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
