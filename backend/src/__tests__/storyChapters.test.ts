import { STORY_CHAPTERS, TOTAL_STORY_LEVELS, getChapterConfig } from "../config/storyChapters";

describe("storyChapters config", () => {
  it("definisce esattamente 6 capitoli", () => {
    expect(STORY_CHAPTERS).toHaveLength(6);
  });

  it("ogni capitolo ha 50 livelli, per un totale di 300", () => {
    expect(STORY_CHAPTERS.every((c) => c.levelsCount === 50)).toBe(true);
    expect(TOTAL_STORY_LEVELS).toBe(300);
  });

  it("i numeri di capitolo sono progressivi da 1 a 6 senza buchi", () => {
    const numbers = STORY_CHAPTERS.map((c) => c.chapterNumber);
    expect(numbers).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("la difficoltà è non decrescente lungo i capitoli", () => {
    const order = { EASY: 0, MEDIUM: 1, HARD: 2, EXPERT: 3 };
    const difficulties = STORY_CHAPTERS.map((c) => order[c.difficulty]);
    for (let i = 1; i < difficulties.length; i++) {
      expect(difficulties[i]).toBeGreaterThanOrEqual(difficulties[i - 1]);
    }
  });

  it("getChapterConfig ritorna undefined per capitoli inesistenti", () => {
    expect(getChapterConfig(0)).toBeUndefined();
    expect(getChapterConfig(7)).toBeUndefined();
    expect(getChapterConfig(1)).toBeDefined();
  });
});
