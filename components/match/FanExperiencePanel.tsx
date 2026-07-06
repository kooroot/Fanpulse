"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Check, Copy, Mic2, Users, Volume2 } from "lucide-react";
import { Badge } from "@/components/common/Badge";
import {
  buildHiLoStatReading,
  buildPunditMoments,
  buildSweepstakeBoard,
  createHiLoChallenge,
  formatHiLoValue,
  resolveHiLoChallenge,
  scoreHiLoPick,
} from "@/lib/experience/fan-experience-engine";
import type {
  FanExperienceInput,
  HiLoChallenge,
  HiLoLocalState,
  HiLoPick,
} from "@/lib/experience/types";

const STORAGE_KEY = "fanpulse.hilo";
const EMPTY_STATE: HiLoLocalState = {
  totalXp: 0,
  streak: 0,
};

type FanExperiencePanelProps = FanExperienceInput & {
  mode: "live" | "fallback";
};

export function FanExperiencePanel(props: FanExperiencePanelProps) {
  const input = props;
  const [state, setState] = useState<HiLoLocalState>(EMPTY_STATE);
  const [copied, setCopied] = useState(false);
  const statReading = buildHiLoStatReading(input);
  const punditMoments = useMemo(() => buildPunditMoments(input), [input]);
  const sweepstake = useMemo(() => buildSweepstakeBoard(input), [input]);
  const activeChallenge =
    state.challenge?.fixtureId === input.fixture.fixtureId &&
    state.challenge.statKey === statReading.key
      ? state.challenge
      : createHiLoChallenge(input);

  useEffect(() => {
    window.queueMicrotask(() => {
      setState(loadState());
    });
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    const challenge = state.challenge;
    if (
      !challenge ||
      challenge.status !== "OPEN" ||
      !challenge.selectedOption
    ) {
      return;
    }
    if (challenge.statKey !== statReading.key) return;

    const oldEnough = Date.now() - challenge.createdAt >= 6000;
    const changed = statReading.value !== challenge.baseline;
    if (!oldEnough && !changed) return;

    const resolved = resolveHiLoChallenge(challenge, statReading.value);
    const result = scoreHiLoPick(resolved);
    window.queueMicrotask(() => {
      setState((current) => ({
        totalXp: current.totalXp + result.xp,
        streak: result.correct ? current.streak + result.streakDelta : 0,
        challenge: resolved,
      }));
    });
  }, [statReading.key, statReading.value, state.challenge]);

  function selectPick(pick: HiLoPick) {
    const challenge =
      activeChallenge.status === "RESOLVED"
        ? createHiLoChallenge(input)
        : activeChallenge;
    setState((current) => ({
      ...current,
      challenge: {
        ...challenge,
        selectedOption: pick,
        status: "OPEN",
        createdAt: Date.now(),
        baseline: statReading.value,
        current: statReading.value,
        resolvedOption: undefined,
        resolvedAt: undefined,
      },
    }));
  }

  function nextRound() {
    setState((current) => ({
      ...current,
      challenge: createHiLoChallenge(input),
    }));
  }

  async function copyPunditThread() {
    const text = punditMoments
      .slice(0, 3)
      .map((moment) => moment.shareLine)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function speakLatest() {
    const latest = punditMoments[0];
    if (!latest || typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(
      new SpeechSynthesisUtterance(`${latest.title}. ${latest.body}`),
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-[#789085]">
            FanPulse Live Lab
          </p>
          <h2 className="text-lg font-black text-[#10261c]">
            Auto Pundit & Fan Games
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Badge tone={props.mode === "live" ? "blue" : "green"}>
            {props.mode === "live" ? "TxLINE live" : "Fallback"}
          </Badge>
          <Badge tone="light">
            {props.mode === "live" ? "5s refresh" : "Replayable"}
          </Badge>
          <Badge tone="light">TxLINE stats</Badge>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <article className="rounded-lg border border-[#dce8d8] bg-white p-4 shadow-sm xl:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Mic2 aria-hidden="true" className="h-5 w-5 text-[#3157d5]" />
              <h3 className="truncate text-base font-black text-[#10261c]">
                Auto Pundit
              </h3>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={speakLatest}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#dce8d8] bg-[#f8fbf6] text-[#10261c] transition hover:bg-[#eef7ec]"
                aria-label="Speak latest pundit line"
              >
                <Volume2 aria-hidden="true" className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={copyPunditThread}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#dce8d8] bg-[#f8fbf6] text-[#10261c] transition hover:bg-[#eef7ec]"
                aria-label="Copy pundit thread"
              >
                {copied ? (
                  <Check aria-hidden="true" className="h-4 w-4" />
                ) : (
                  <Copy aria-hidden="true" className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {punditMoments.slice(0, 3).map((moment) => (
              <div
                key={moment.id}
                className="rounded-lg bg-[#f7faf5] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[#10261c]">
                    {moment.title}
                  </p>
                  <ToneBadge tone={moment.tone} />
                </div>
                <p className="mt-1 text-[11px] font-black uppercase tracking-normal text-[#789085]">
                  {moment.source === "odds"
                    ? "Odds-derived market mood"
                    : moment.source === "pulse-card"
                      ? "Pulse Card"
                      : "Momentum Meter"}
                </p>
                <p className="mt-1 text-sm leading-6 text-[#52685d]">
                  {moment.body}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg border border-[#dce8d8] bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BarChart3 aria-hidden="true" className="h-5 w-5 text-[#ff7a45]" />
                <h3 className="text-base font-black text-[#10261c]">
                  Hi-Lo Stats
                </h3>
              </div>
              <p className="mt-2 text-xs font-black uppercase tracking-normal text-[#789085]">
                {activeChallenge.sourceLabel}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#5d7167]">
                {activeChallenge.question}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-black uppercase text-[#789085]">
                XP
              </p>
              <p className="text-lg font-black text-[#10261c]">
                {state.totalXp}
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {activeChallenge.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => selectPick(option)}
                disabled={activeChallenge.status === "RESOLVED"}
                className={`h-10 rounded-lg border text-sm font-black transition ${
                  activeChallenge.selectedOption === option
                    ? "border-[#10261c] bg-[#10261c] text-white"
                    : "border-[#dce8d8] bg-[#f8fbf6] text-[#395047] hover:border-[#10261c]"
                } disabled:opacity-70`}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 text-xs font-bold text-[#789085]">
            <span>
              {activeChallenge.label} {formatHiLoValue(activeChallenge.baseline)} to{" "}
              {formatHiLoValue(statReading.value)}
            </span>
            <span>Streak {state.streak}</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-[#789085]">
            Current stat count: {statReading.rawCount}
          </p>
          {activeChallenge.status === "RESOLVED" ? (
            <button
              type="button"
              onClick={nextRound}
              className="mt-3 h-10 w-full rounded-lg bg-[#ff7a45] text-sm font-black text-[#10261c] transition hover:bg-[#ff986f]"
            >
              Next Round
            </button>
          ) : null}
        </article>

        <article className="rounded-lg border border-[#dce8d8] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Users aria-hidden="true" className="h-5 w-5 text-[#15b56d]" />
            <h3 className="text-base font-black text-[#10261c]">
              Group Sweepstake
            </h3>
          </div>
          <div className="space-y-2">
            {sweepstake.map((row) => (
              <div
                key={`${row.name}-${row.team}`}
                className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg bg-[#f7faf5] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#10261c]">
                    {row.name} - {row.team}
                  </p>
                  <p className="text-xs font-bold text-[#789085]">
                    {row.note}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-[#10261c]">
                    {row.points}
                  </p>
                  {row.leader ? <Badge tone="orange">Leader</Badge> : null}
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}

function ToneBadge({ tone }: { tone: string }) {
  const label =
    tone === "chaos"
      ? "Chaos"
      : tone === "swing"
        ? "Swing"
        : tone === "pressure"
          ? "Pressure"
          : tone === "final"
            ? "Final"
            : "Calm";

  return (
    <Badge tone={tone === "chaos" || tone === "swing" ? "orange" : "light"}>
      {label}
    </Badge>
  );
}

function loadState(): HiLoLocalState {
  if (typeof window === "undefined") return EMPTY_STATE;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_STATE;
    const parsed = JSON.parse(raw) as Partial<HiLoLocalState>;
    return {
      totalXp: Number(parsed.totalXp ?? 0),
      streak: Number(parsed.streak ?? 0),
      challenge: parsed.challenge as HiLoChallenge | undefined,
    };
  } catch {
    return EMPTY_STATE;
  }
}

function saveState(state: HiLoLocalState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
