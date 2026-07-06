import type { MatchSnapshot, ReplayEvent, ReplayMatch } from "@/lib/pulse/types";
import { derivePulseCards } from "@/lib/pulse/pulse-card-engine";
import { computePulseMeter } from "@/lib/pulse/pulse-meter";
import { buildMatchStory } from "@/lib/pulse/story-builder";
import { FINAL_PHASE_IDS } from "@/lib/txline/types";

export type ReplayStatus = "idle" | "running" | "paused" | "finished";

export type ReplayState = {
  status: ReplayStatus;
  elapsedMs: number;
  speed: 1 | 5 | 20;
  nextIndex: number;
  emittedEvents: ReplayEvent[];
};

export function createReplayState(speed: 1 | 5 | 20 = 1): ReplayState {
  return {
    status: "idle",
    elapsedMs: 0,
    speed,
    nextIndex: 0,
    emittedEvents: [],
  };
}

export function startReplay(state: ReplayState): ReplayState {
  if (state.status === "finished") {
    return { ...createReplayState(state.speed), status: "running" };
  }

  return { ...state, status: "running" };
}

export function pauseReplay(state: ReplayState): ReplayState {
  return state.status === "running" ? { ...state, status: "paused" } : state;
}

export function resetReplay(state: ReplayState): ReplayState {
  return createReplayState(state.speed);
}

export function setReplaySpeed(
  state: ReplayState,
  speed: ReplayState["speed"],
): ReplayState {
  return { ...state, speed };
}

export function advanceReplay(
  replay: ReplayMatch,
  state: ReplayState,
  realDeltaMs: number,
): ReplayState {
  if (state.status !== "running") return state;

  const elapsedMs = Math.min(
    replay.durationMs,
    state.elapsedMs + realDeltaMs * state.speed,
  );
  const newlyEmitted: ReplayEvent[] = [];
  let nextIndex = state.nextIndex;

  while (
    nextIndex < replay.timeline.length &&
    replay.timeline[nextIndex].offsetMs <= elapsedMs
  ) {
    newlyEmitted.push(replay.timeline[nextIndex]);
    nextIndex += 1;
  }

  return {
    ...state,
    elapsedMs,
    nextIndex,
    emittedEvents: [...state.emittedEvents, ...newlyEmitted],
    status: elapsedMs >= replay.durationMs ? "finished" : "running",
  };
}

export function getReplayEventsAt(
  replay: ReplayMatch,
  elapsedMs: number,
): ReplayEvent[] {
  return replay.timeline.filter((event) => event.offsetMs <= elapsedMs);
}

export function getReplaySnapshot(
  replay: ReplayMatch,
  elapsedMs: number = replay.durationMs,
): MatchSnapshot {
  const events = getReplayEventsAt(replay, elapsedMs);
  const scoreUpdates = events
    .filter((event) => event.kind === "score")
    .map((event) => event.score);
  const oddsUpdates = events
    .filter((event) => event.kind === "odds")
    .map((event) => event.odds);
  const score = scoreUpdates.at(-1);
  const pulseCards = derivePulseCards({
    fixture: replay.fixture,
    scoreUpdates,
    oddsUpdates,
  });
  const pulseMeter = computePulseMeter({
    fixture: replay.fixture,
    scoreUpdates,
    oddsUpdates,
    pulseCards,
  });
  const isFinal = score?.phaseId ? FINAL_PHASE_IDS.has(score.phaseId) : false;

  return {
    fixture: replay.fixture,
    score,
    odds: oddsUpdates,
    pulseCards,
    pulseMeter,
    story: isFinal
      ? buildMatchStory({
          fixture: replay.fixture,
          score,
          pulseCards,
          pulseMeter,
        })
      : undefined,
  };
}
