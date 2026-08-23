import { seedBadges } from "../src/scripts/seed";

seedBadges().catch((err) => {
  console.error("❌ Errore durante il seed:", err);
  process.exit(1);
});
