import { PHASES } from "@/lib/txline/types";

export function formatMinute(minute?: number): string {
  if (minute === undefined) return "0'";
  return `${Math.max(0, Math.round(minute))}'`;
}

export function formatPhase(phaseId?: number, fallback?: string): string {
  if (phaseId && PHASES[phaseId]) {
    return PHASES[phaseId].short;
  }

  return fallback ?? "Pending";
}

export function formatScore(p1?: number, p2?: number): string {
  return `${p1 ?? 0} - ${p2 ?? 0}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
