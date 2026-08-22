import {
  loginSchema,
  registerSchema,
  updateThemeSchema,
} from "../validators/authValidators";
import {
  chapterLevelParamsSchema,
  randomDifficultySchema,
  submitSolutionSchema,
} from "../validators/puzzleValidators";

describe("authValidators", () => {
  it("accetta una registrazione valida", () => {
    const result = registerSchema.safeParse({
      email: "utente@esempio.it",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rifiuta un'email non valida", () => {
    const result = registerSchema.safeParse({
      email: "non-una-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rifiuta una password troppo corta", () => {
    const result = registerSchema.safeParse({
      email: "utente@esempio.it",
      password: "corta",
    });
    expect(result.success).toBe(false);
  });

  it("il login non impone un minimo di lunghezza sulla password", () => {
    const result = loginSchema.safeParse({
      email: "utente@esempio.it",
      password: "x",
    });
    expect(result.success).toBe(true);
  });

  it("accetta solo LIGHT o DARK per il tema", () => {
    expect(updateThemeSchema.safeParse({ theme: "DARK" }).success).toBe(true);
    expect(updateThemeSchema.safeParse({ theme: "BLU" }).success).toBe(false);
  });
});

describe("puzzleValidators", () => {
  it("accetta un piazzamento valido riferito per characterId", () => {
    const result = submitSolutionSchema.safeParse({
      placement: [
        { characterId: "abc", row: 0, col: 1 },
        { characterId: "def", row: 2, col: 3 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rifiuta un piazzamento vuoto", () => {
    const result = submitSolutionSchema.safeParse({ placement: [] });
    expect(result.success).toBe(false);
  });

  it("applica MEDIUM come default per la difficoltà random", () => {
    const result = randomDifficultySchema.parse({});
    expect(result.difficulty).toBe("MEDIUM");
  });

  it("converte correttamente i parametri capitolo/livello da stringa", () => {
    const result = chapterLevelParamsSchema.parse({ chapter: "3", level: "12" });
    expect(result.chapter).toBe(3);
    expect(result.level).toBe(12);
  });

  it("rifiuta un capitolo fuori range (1-6)", () => {
    const result = chapterLevelParamsSchema.safeParse({ chapter: "7", level: "1" });
    expect(result.success).toBe(false);
  });
});
