import { describe, expect, it } from "vitest";
import { derivePulseCards } from "@/lib/pulse/pulse-card-engine";
import {
  EMPTY_FAN_QUEST_STATE,
  FAN_QUEST_REQUIRES_ACCOUNT,
  FAN_QUEST_REWARD_KIND,
  applyResolvedQuest,
  buildReplayQuestQueue,
  resolveFanQuest,
  selectQuestOption,
} from "@/lib/pulse/quest-engine";
import { getDemoReplayMatch } from "@/lib/replay/sample-data";

describe("quest-engine", () => {
  const replay = getDemoReplayMatch();
  const cards = derivePulseCards(replay);

  it("creates free fan quests", () => {
    const quests = buildReplayQuestQueue(replay.fixture);

    expect(quests.length).toBeGreaterThanOrEqual(2);
    expect(quests[0].question).toBe("What happens next?");
  });

  it("resolves quest based on replay events", () => {
    const quest = buildReplayQuestQueue(replay.fixture)[0];
    const resolved = resolveFanQuest({
      quest,
      fixture: replay.fixture,
      scoreUpdates: replay.scoreUpdates,
      pulseCards: cards,
      nowTs: 25,
    });

    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.resolvedOption).toBe("Corner");
  });

  it("awards XP only", () => {
    const quest = buildReplayQuestQueue(replay.fixture)[0];
    const selected = selectQuestOption(
      EMPTY_FAN_QUEST_STATE,
      quest,
      "Corner",
    );
    const resolved = resolveFanQuest({
      quest,
      fixture: replay.fixture,
      scoreUpdates: replay.scoreUpdates,
      pulseCards: cards,
      nowTs: 25,
    });
    const nextState = applyResolvedQuest(selected, resolved);

    expect(nextState.totalXp).toBe(20);
    expect(FAN_QUEST_REWARD_KIND).toBe("local_xp");
  });

  it("does not require wallet/account", () => {
    expect(FAN_QUEST_REQUIRES_ACCOUNT).toBe(false);
  });
});
