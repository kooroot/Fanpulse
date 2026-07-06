"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { FanQuestCard } from "@/components/match/FanQuestCard";
import { LocalXpBadge } from "@/components/match/LocalXpBadge";
import { PulseCard } from "@/components/match/PulseCard";
import { PulseMeter } from "@/components/match/PulseMeter";
import { PulseTimeline } from "@/components/match/PulseTimeline";
import { ReplayControls } from "@/components/match/ReplayControls";
import { ScoreHeader } from "@/components/match/ScoreHeader";
import type { FanQuest, FanQuestState, ReplayMatch } from "@/lib/pulse/types";
import {
  EMPTY_FAN_QUEST_STATE,
  applyResolvedQuest,
  buildReplayQuestQueue,
  getActiveQuest,
  loadFanQuestState,
  resolveFanQuest,
  saveFanQuestState,
  selectQuestOption,
} from "@/lib/pulse/quest-engine";
import {
  advanceReplay,
  createReplayState,
  getReplaySnapshot,
  pauseReplay,
  resetReplay,
  setReplaySpeed,
  startReplay,
  type ReplayState,
} from "@/lib/replay/replay-engine";

type MobileMatchShellProps = {
  replay: ReplayMatch;
};

export function MobileMatchShell({ replay }: MobileMatchShellProps) {
  const [replayState, setReplayState] = useState<ReplayState>(() =>
    createReplayState(1),
  );
  const [questState, setQuestState] = useState<FanQuestState>(
    EMPTY_FAN_QUEST_STATE,
  );
  const [resolvedQuests, setResolvedQuests] = useState<Record<string, FanQuest>>(
    {},
  );
  const snapshot = useMemo(
    () => getReplaySnapshot(replay, replayState.elapsedMs),
    [replay, replayState.elapsedMs],
  );
  const questQueue = useMemo(
    () => buildReplayQuestQueue(replay.fixture),
    [replay.fixture],
  );
  const nowTs = replayState.elapsedMs / 1000;
  const activeQuest = getActiveQuest(questQueue, nowTs, questState);
  const latestResolvedQuest = Object.values(resolvedQuests).sort(
    (a, b) => (a.resolvedAt ?? 0) - (b.resolvedAt ?? 0),
  ).at(-1);
  const visibleQuest = activeQuest ?? latestResolvedQuest;
  const latestPulse = snapshot.pulseCards.at(-1);
  const matchFinished = replayState.status === "finished" || Boolean(snapshot.story);

  useEffect(() => {
    window.queueMicrotask(() => {
      setQuestState(loadFanQuestState());
    });
  }, []);

  useEffect(() => {
    saveFanQuestState(questState);
  }, [questState]);

  useEffect(() => {
    if (replayState.status !== "running") return;

    const timer = window.setInterval(() => {
      setReplayState((current) => advanceReplay(replay, current, 250));
    }, 250);

    return () => window.clearInterval(timer);
  }, [replay, replayState.status]);

  useEffect(() => {
    if (!activeQuest || questState.resolved[activeQuest.id]) return;
    const selected = questState.answered[activeQuest.id];
    const shouldResolve =
      Boolean(selected) &&
      (nowTs >= activeQuest.createdAt + 18 || replayState.status === "finished");
    if (!shouldResolve) return;

    const resolved = resolveFanQuest({
      quest: activeQuest,
      fixture: replay.fixture,
      scoreUpdates: replay.scoreUpdates,
      pulseCards: snapshot.pulseCards,
      nowTs,
    });

    window.queueMicrotask(() => {
      setResolvedQuests((current) => ({
        ...current,
        [resolved.id]: resolved,
      }));
      setQuestState((current) => applyResolvedQuest(current, resolved));
    });
  }, [activeQuest, nowTs, questState, replay, replayState.status, snapshot.pulseCards]);

  function handleReset() {
    setReplayState((current) => resetReplay(current));
    setResolvedQuests({});
    setQuestState((current) => ({
      ...current,
      answered: {},
      resolved: {},
    }));
  }

  function handleQuestSelect(option: string) {
    if (!activeQuest) return;
    setQuestState((current) => selectQuestOption(current, activeQuest, option));
  }

  return (
    <div className="min-h-screen bg-[#f7faf5] pb-24">
      <ScoreHeader fixture={replay.fixture} score={snapshot.score} />
      <main className="mx-auto max-w-md space-y-4 px-4 py-4">
        <ReplayControls
          state={replayState}
          durationMs={replay.durationMs}
          onStart={() => setReplayState((current) => startReplay(current))}
          onPause={() => setReplayState((current) => pauseReplay(current))}
          onReset={handleReset}
          onSpeedChange={(speed) =>
            setReplayState((current) => setReplaySpeed(current, speed))
          }
        />

        <PulseMeter fixture={replay.fixture} meter={snapshot.pulseMeter} />

        {latestPulse ? (
          <section className="space-y-3">
            <h2 className="text-lg font-black text-[#10261c]">
              Latest Pulse Card
            </h2>
            <PulseCard card={latestPulse} featured />
          </section>
        ) : null}

        <LocalXpBadge state={questState} />

        <FanQuestCard
          quest={visibleQuest}
          selectedOption={
            visibleQuest ? questState.answered[visibleQuest.id] : undefined
          }
          onSelect={handleQuestSelect}
        />

        {matchFinished ? (
          <Link
            href={`/story/${replay.fixture.fixtureId}`}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#ff7a45] px-4 text-sm font-black text-[#10261c] transition hover:bg-[#ff986f]"
          >
            <BookOpen aria-hidden="true" className="h-4 w-4" />
            View Match Story
          </Link>
        ) : null}

        <PulseTimeline cards={snapshot.pulseCards} />
      </main>
      <footer className="px-4 pb-5 text-center text-xs font-semibold text-[#5d7167]">
        Unofficial fan experience. No betting. No official tournament
        affiliation.
      </footer>
    </div>
  );
}
