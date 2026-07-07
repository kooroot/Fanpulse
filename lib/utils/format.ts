import type { NormalizedFixture, NormalizedScoreUpdate } from "@/lib/txline/types";
import { FINAL_PHASE_IDS, PHASES } from "@/lib/txline/types";

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

export type FixtureDisplayKind =
  | "live"
  | "live-window"
  | "starting-soon"
  | "upcoming"
  | "final"
  | "recent"
  | "replay"
  | "txline";

export type FixtureDisplayStatus = {
  kind: FixtureDisplayKind;
  label: string;
  detail: string;
  isLive: boolean;
};

export function getFixtureDisplayStatus(
  fixture: NormalizedFixture,
  score?: NormalizedScoreUpdate,
  now = new Date(),
): FixtureDisplayStatus {
  if (fixture.source === "replay") {
    return {
      kind: "replay",
      label: "Replay",
      detail: fixture.status ?? "Fallback replay",
      isLive: false,
    };
  }

  const phaseId = score?.phaseId;
  if (phaseId && FINAL_PHASE_IDS.has(phaseId)) {
    return {
      kind: "final",
      label: "Final",
      detail: PHASES[phaseId]?.label ?? "Match finished",
      isLive: false,
    };
  }

  if (phaseId && LIVE_PHASE_IDS.has(phaseId)) {
    return {
      kind: "live",
      label: "Live",
      detail: PHASES[phaseId]?.label ?? "Match in progress",
      isLive: true,
    };
  }

  const parsedStatus = parseFixtureStatus(fixture.status);
  if (parsedStatus) return parsedStatus;

  return statusFromStartTime(fixture.startTime, now);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeTeamName(team: string): string {
  return team.trim().toLowerCase();
}

function parseFixtureStatus(status?: string): FixtureDisplayStatus | undefined {
  if (!status) return undefined;

  const normalized = status.trim().toLowerCase();
  if (!normalized) return undefined;

  if (FINAL_STATUS_LABELS.some((label) => normalized.includes(label))) {
    return {
      kind: "final",
      label: "Final",
      detail: status,
      isLive: false,
    };
  }

  if (LIVE_STATUS_LABELS.some((label) => normalized.includes(label))) {
    return {
      kind: "live",
      label: "Live",
      detail: status,
      isLive: true,
    };
  }

  if (UPCOMING_STATUS_LABELS.some((label) => normalized.includes(label))) {
    return {
      kind: "upcoming",
      label: "Upcoming",
      detail: status,
      isLive: false,
    };
  }

  return undefined;
}

function statusFromStartTime(
  startTime: string | undefined,
  now: Date,
): FixtureDisplayStatus {
  if (!startTime) {
    return {
      kind: "txline",
      label: "TxLINE",
      detail: "Fixture data ready",
      isLive: false,
    };
  }

  const startMs = Date.parse(startTime);
  const nowMs = now.getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(nowMs)) {
    return {
      kind: "txline",
      label: "TxLINE",
      detail: "Fixture time pending",
      isLive: false,
    };
  }

  const fiveMinutes = 5 * 60 * 1000;
  const liveWindow = 3 * 60 * 60 * 1000;

  if (startMs > nowMs + fiveMinutes) {
    return {
      kind: "upcoming",
      label: "Upcoming",
      detail: formatKickoffDistance(startMs, nowMs),
      isLive: false,
    };
  }

  if (startMs > nowMs) {
    return {
      kind: "starting-soon",
      label: "Starting soon",
      detail: "Kickoff window",
      isLive: false,
    };
  }

  if (nowMs - startMs <= liveWindow) {
    return {
      kind: "live-window",
      label: "Live window",
      detail: "Started recently",
      isLive: true,
    };
  }

  return {
    kind: "recent",
    label: "Recent",
    detail: "Awaiting final status",
    isLive: false,
  };
}

function formatKickoffDistance(startMs: number, nowMs: number): string {
  const diffMinutes = Math.max(1, Math.round((startMs - nowMs) / 60000));
  if (diffMinutes < 60) return `${diffMinutes}m to kickoff`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 48) return `${diffHours}h to kickoff`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d to kickoff`;
}

const LIVE_PHASE_IDS = new Set([2, 3, 4, 6, 7, 8, 9, 11, 12]);
const LIVE_STATUS_LABELS = [
  "live",
  "in play",
  "in-play",
  "first half",
  "second half",
  "halftime",
  "extra time",
  "penalty",
  "h1",
  "h2",
  "ht",
];
const FINAL_STATUS_LABELS = [
  "final",
  "finished",
  "full time",
  "full-time",
  "ft",
  "ended",
];
const UPCOMING_STATUS_LABELS = [
  "not started",
  "scheduled",
  "upcoming",
  "fixture",
  "pending",
  "ns",
];

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
