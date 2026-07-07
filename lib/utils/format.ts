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

export function formatTeamName(team: string): string {
  const flag = TEAM_FLAGS[normalizeTeamName(team)];
  return flag ? `${flag} ${team}` : team;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeTeamName(team: string): string {
  return team.trim().toLowerCase();
}

const TEAM_FLAGS: Record<string, string> = {
  albania: "🇦🇱",
  algeria: "🇩🇿",
  argentina: "🇦🇷",
  australia: "🇦🇺",
  austria: "🇦🇹",
  belgium: "🇧🇪",
  bolivia: "🇧🇴",
  "bosnia and herzegovina": "🇧🇦",
  brazil: "🇧🇷",
  bulgaria: "🇧🇬",
  cameroon: "🇨🇲",
  canada: "🇨🇦",
  chile: "🇨🇱",
  china: "🇨🇳",
  colombia: "🇨🇴",
  "costa rica": "🇨🇷",
  "cote d'ivoire": "🇨🇮",
  "côte d'ivoire": "🇨🇮",
  croatia: "🇭🇷",
  "czech republic": "🇨🇿",
  czechia: "🇨🇿",
  denmark: "🇩🇰",
  ecuador: "🇪🇨",
  egypt: "🇪🇬",
  england: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  france: "🇫🇷",
  germany: "🇩🇪",
  ghana: "🇬🇭",
  greece: "🇬🇷",
  honduras: "🇭🇳",
  hungary: "🇭🇺",
  iceland: "🇮🇸",
  india: "🇮🇳",
  indonesia: "🇮🇩",
  iran: "🇮🇷",
  "ir iran": "🇮🇷",
  iraq: "🇮🇶",
  ireland: "🇮🇪",
  italy: "🇮🇹",
  "ivory coast": "🇨🇮",
  japan: "🇯🇵",
  jordan: "🇯🇴",
  "korea dpr": "🇰🇵",
  "korea republic": "🇰🇷",
  "north korea": "🇰🇵",
  "south korea": "🇰🇷",
  mexico: "🇲🇽",
  morocco: "🇲🇦",
  netherlands: "🇳🇱",
  "new zealand": "🇳🇿",
  nigeria: "🇳🇬",
  "northern ireland": "🇬🇧",
  norway: "🇳🇴",
  panama: "🇵🇦",
  paraguay: "🇵🇾",
  peru: "🇵🇪",
  poland: "🇵🇱",
  portugal: "🇵🇹",
  qatar: "🇶🇦",
  romania: "🇷🇴",
  russia: "🇷🇺",
  "saudi arabia": "🇸🇦",
  scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  senegal: "🇸🇳",
  serbia: "🇷🇸",
  slovakia: "🇸🇰",
  slovenia: "🇸🇮",
  "south africa": "🇿🇦",
  spain: "🇪🇸",
  switzerland: "🇨🇭",
  sweden: "🇸🇪",
  tunisia: "🇹🇳",
  turkey: "🇹🇷",
  türkiye: "🇹🇷",
  uae: "🇦🇪",
  ukraine: "🇺🇦",
  "united arab emirates": "🇦🇪",
  usa: "🇺🇸",
  "united states": "🇺🇸",
  "united states of america": "🇺🇸",
  uruguay: "🇺🇾",
  venezuela: "🇻🇪",
  wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
};
