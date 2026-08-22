import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`🔎 Kill-Doku backend in ascolto sulla porta ${env.PORT} (${env.NODE_ENV})`);
});
