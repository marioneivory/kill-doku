import { z } from "zod";

// Il piazzamento è riferito esplicitamente per ID personaggio (non per
// posizione in un array), per evitare bug di ordinamento tra ciò che il
// client mostra e ciò che il server si aspetta.
export const submitSolutionSchema = z.object({
  placement: z
    .array(
      z.object({
        characterId: z.string().min(1),
        row: z.number().int().min(0),
        col: z.number().int().min(0),
      })
    )
    .min(1, "Il piazzamento non può essere vuoto."),
  // Tempo impiegato dall'utente, in secondi (usato per le statistiche Random).
  elapsedSeconds: z.number().int().min(0).optional(),
});

export const randomDifficultySchema = z.object({
  difficulty: z.enum(["EASY", "MEDIUM", "HARD", "EXPERT"]).default("MEDIUM"),
});

export const chapterLevelParamsSchema = z.object({
  chapter: z.coerce.number().int().min(1).max(6),
  level: z.coerce.number().int().min(1).max(50),
});
