# Kill-Doku — Backend

API REST in Node.js + TypeScript + Express, con motore di generazione
procedurale di puzzle (`src/engine/`), autenticazione JWT e persistenza
PostgreSQL via Prisma.

## Stack

- Node.js 20 + TypeScript + Express
- PostgreSQL + Prisma ORM
- JWT (access + refresh token con rotazione) + bcrypt
- Validazione input con Zod
- Test con Jest

## Struttura

```
src/
  engine/        motore di generazione/validazione puzzle (isolato, testato)
  routes/        definizione endpoint Express
  controllers/   parsing richiesta/risposta HTTP
  services/      logica di dominio e accesso al DB (Prisma)
  middleware/    auth JWT, gestione errori centralizzata
  validators/    schemi Zod
  config/        env, configurazione capitoli Storia
  lib/           client Prisma singleton
prisma/
  schema.prisma  data model
  seed.ts        crea i badge placeholder dei 6 capitoli
```

## Sviluppo locale

Prerequisiti: Node.js 20+, un'istanza PostgreSQL raggiungibile (locale o
Docker: `docker run -e POSTGRES_PASSWORD=pass -p 5432:5432 postgres:16`).

```bash
cp .env.example .env
# modifica .env con la tua DATABASE_URL e dei JWT secret reali
npm install            # esegue anche `prisma generate` (postinstall)
npm run prisma:migrate:dev   # crea le tabelle
npm run prisma:seed          # crea i badge placeholder
npm run dev             # avvia con hot-reload su http://localhost:3000
```

> **Nota rete**: `prisma generate` scarica i binari del motore Prisma da
> `binaries.prisma.sh`. Se lavori dietro un firewall/proxy aziendale che
> blocca questo dominio, aggiungilo alla whitelist di rete: senza, il
> comando fallisce con un errore 403/timeout, non è un bug del codice.

## Test

```bash
npm test
```

Suite attuale: **32 test su 5 file**, tutti eseguibili senza un database
reale (nessuno di questi importa il client Prisma):

- `puzzleGenerator.test.ts` — genera 50 puzzle per ciascuna delle 4
  difficoltà (EASY/MEDIUM/HARD/EXPERT) e verifica via solver a
  backtracking che il 100% abbia soluzione unica, più test di integrità
  strutturale (vincolo riga/colonna, coerenza vittima/assassino,
  occupabilità celle).
- `password.test.ts` — hashing/verifica bcrypt, unicità del salt.
- `jwt.test.ts` — firma/verifica access e refresh token, rifiuto token
  manomessi o con segreto sbagliato.
- `validators.test.ts` — schemi Zod per auth e puzzle (registrazione,
  login, tema, piazzamento soluzione, parametri capitolo/livello).
- `storyChapters.test.ts` — coerenza della configurazione dei 6 capitoli
  (300 livelli totali, difficoltà non decrescente, nessun buco nella
  numerazione).

I test che toccano il database (service layer con Prisma) non sono
inclusi in questa suite perché richiedono un'istanza Postgres reale e il
client Prisma generato — vedi la nota sulla generazione più sotto. Sono
un'estensione naturale da aggiungere con un DB di test dedicato (es. via
`docker-compose` + `prisma migrate deploy` su schema `test`).

## Deploy su Railway — passo per passo

1. **Crea il progetto**
   - Vai su [railway.app](https://railway.app) → *New Project*.
   - Scegli *Deploy from GitHub repo* e seleziona il repository che
     contiene questa cartella `backend/` (se il repo ha anche `mobile/`,
     imposta il **Root Directory** del servizio su `backend`).

2. **Aggiungi PostgreSQL**
   - Nel progetto Railway: *New* → *Database* → *Add PostgreSQL*.
   - Railway crea automaticamente la variabile `DATABASE_URL` sul plugin.

3. **Collega il DB al servizio backend**
   - Apri il servizio backend → tab *Variables*.
   - Aggiungi `DATABASE_URL` come **reference** al plugin Postgres:
     `${{Postgres.DATABASE_URL}}` (Railway te lo suggerisce in autocomplete).

4. **Imposta le altre variabili d'ambiente** (tab *Variables* del servizio):
   ```
   NODE_ENV=production
   JWT_SECRET=<stringa lunga e casuale, es. output di `openssl rand -base64 48`>
   JWT_REFRESH_SECRET=<un'altra stringa lunga e casuale, diversa dalla precedente>
   JWT_ACCESS_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN_DAYS=30
   CORS_ORIGIN=<dominio della tua app mobile/webview, o * in fase di test>
   ```
   `PORT` non va impostata manualmente: Railway la inietta automaticamente
   e il codice legge `process.env.PORT`.

5. **Build & deploy automatico**
   - Railway rileva il `Dockerfile` (grazie a `railway.json`, che forza
     esplicitamente il builder Docker) e builda l'immagine multi-stage.
   - Al via del container, il comando di avvio esegue prima
     `npx prisma migrate deploy` (applica tutte le migration pendenti al
     DB collegato) e poi avvia `node dist/index.js`. **Le migration
     girano automaticamente ad ogni deploy**, come richiesto.

6. **Verifica**
   - Railway espone un URL pubblico tipo `https://kill-doku-backend.up.railway.app`.
   - Controlla `GET /health` → deve rispondere `{"status":"ok",...}`.
   - Railway usa lo stesso path come healthcheck (`railway.json`).

7. **Popola i badge placeholder** (una tantum, dopo il primo deploy):
   - Da Railway → servizio backend → tab *Shell* (o via `railway run`
     dalla CLI locale collegata al progetto):
     ```bash
     npm run prisma:seed
     ```

8. **Collega il frontend Expo**
   - Nel progetto `mobile/`, imposta `EXPO_PUBLIC_API_URL` all'URL
     pubblico Railway ottenuto al punto 6.

### Note sulle migration in produzione

Ogni volta che modifichi `prisma/schema.prisma`, genera una nuova
migration in locale (`npx prisma migrate dev --name descrizione_modifica`),
committala nel repo (cartella `prisma/migrations/`), e il prossimo deploy
su Railway la applicherà automaticamente tramite `prisma migrate deploy`
nello start command — non serve intervento manuale sul DB di produzione.
