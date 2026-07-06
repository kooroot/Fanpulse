export const SECOND = 1000;
export const MINUTE = 60 * SECOND;

export function nowIso(): string {
  return new Date().toISOString();
}

export function secondsToClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
