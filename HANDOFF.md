# Kill-Doku — Stato del progetto

Aggiornato il 23 agosto 2026 dopo verifica completa di backend e web app
su Railway. Questo documento è la fonte operativa da leggere prima di
intervenire sul progetto.

## 1. Stato sintetico

- Monorepo GitHub: https://github.com/marioneivory/kill-doku (`main`).
- Backend Node/Express/Prisma online e verificato end-to-end.
- Database PostgreSQL inizializzato tramite migrazione Prisma versionata.
- Web app Expo pubblicata su Railway e utilizzabile direttamente da smartphone.
- 32 test backend verdi; build TypeScript backend e mobile typecheck verdi.
- Il fix degli input e il fallback web dei token sono ora su GitHub.

## 2. Link da usare

### App giocabile da smartphone

https://mobile-web-production-c899.up.railway.app

È il link da aprire con Safari/Chrome sul telefono. Il 23 agosto 2026 è
stato verificato con viewport 390×844: HTTP 200, login e registrazione
renderizzati correttamente e nessun errore console.

### API backend

https://backend-production-59ea.up.railway.app

È un'API, non l'interfaccia del gioco. Healthcheck:
`GET /health` → HTTP 200 con `{"status":"ok","service":"kill-doku-backend"}`.

## 3. Infrastruttura Railway

| Voce | Valore |
|---|---|
| Account | marioneivory (nappi.mario90@gmail.com) |
| Progetto | `kill-doku` |
| Project ID | `dcc0f003-69c5-4d3d-86d1-2e102d0f683d` |
| Environment | `production` — `711d34ed-a401-4a03-9d37-7868365ad48a` |
| Backend | `backend` — `1d39e087-79e5-45ed-b2fc-59365c94a1be` |
| Mobile web | `mobile-web` — `a9fb80ff-f834-4e78-bf65-682843b08b26` |
| PostgreSQL reale | `Postgres-Q8o1` — `e161cb48-b2c3-4dee-9a7d-1e3411b36499` |
| Servizio Postgres errato | `Postgres` — `ddf4c7f2-fc76-4e9d-ae3b-e62e327f7455` |
| Dominio mobile-web | ID `74f20eaa-60f5-4d14-8315-7f464eec89a3`, porta 8080, ACTIVE |

Il servizio `Postgres` errato è fermo/CRASHED, non ha volume e non è usato.
Può essere eliminato manualmente dalla dashboard, facendo attenzione a non
toccare `Postgres-Q8o1`.

Variabili backend configurate (valori segreti non riportati qui):

- `NODE_ENV=production`
- `DATABASE_URL=${{Postgres-Q8o1.DATABASE_URL}}`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET` (diverso da `JWT_SECRET`)
- `JWT_ACCESS_EXPIRES_IN=15m`
- `JWT_REFRESH_EXPIRES_IN_DAYS=30`
- `CORS_ORIGIN=*`

## 4. Punto 3.1 — RISOLTO E VERIFICATO

Lo script richiesto era già presente su GitHub nel commit `ee433fa`:

```json
"start": "npx prisma migrate deploy && npx ts-node prisma/seed.ts && node dist/index.js"
```

La sola presenza dello script non bastava. Il deploy corrispondente
`65751f3a-f6e0-44f7-889d-0195b93fb3cd` era `FAILED` e i log hanno mostrato
due cause aggiuntive:

1. non esisteva `prisma/migrations`, quindi Prisma riportava
   `No migration found in prisma/migrations` e non creava alcuna tabella;
2. il `startCommand` Railway con `&&` eseguiva solo la parte Prisma e non
   avviava il server nel runtime Docker.

Correzioni applicate:

- commit `48d3f88`: migrazione iniziale versionata
  `20260823110000_init`, avvio Railway tramite `npm run start`, Dockerfile
  allineato e `.gitignore`;
- commit `ef40455`: seed compilato in `dist/scripts/seed.js` per non
  dipendere dai sorgenti/da `ts-node` nell'immagine runtime;
- `railway.json` ora forza il builder Docker, usa
  `preDeployCommand: ["npx prisma migrate deploy"]` e
  `startCommand: "npm run start"`;
- lo script canonico attuale è:

```json
"start": "npx prisma migrate deploy && node dist/scripts/seed.js && node dist/index.js"
```

Verifica Railway finale backend:

- deploy `e017978f-a486-439b-89c0-9fcef67672c9`: `SUCCESS`;
- log: `Applying migration 20260823110000_init`;
- log: `All migrations have been successfully applied`;
- log: `Seed completato: 6 badge capitolo creati/verificati`;
- log: backend in ascolto sulla porta 8080;
- healthcheck Railway: `GET /health` → 200;
- test esterno: `POST /auth/register` → 201 con access token e refresh token;
- log HTTP Railway della stessa richiesta: status 201 (non 500).

## 5. Web app Railway

Il commit `113584b` aggiunge:

- dipendenze Expo web (`react-dom`, `react-native-web`, metro runtime);
- export statico Expo;
- server SPA `serve` compatibile con `$PORT` Railway;
- `mobile/Dockerfile`, `mobile/railway.json`, `.dockerignore` e `.env.example`;
- fallback `localStorage` per i token solo sul web; iOS/Android continuano
  a usare SecureStore;
- fix `Input.tsx` che preserva gli stili base quando viene passato uno
  stile aggiuntivo.

Deploy mobile web verificato:

- servizio `mobile-web`;
- deploy `88151c1f-767a-4272-ba64-0cbff43fadf1`: `SUCCESS`;
- builder Docker, healthcheck `/` → 200;
- server in ascolto sulla porta 8080;
- dominio pubblico Railway ACTIVE.

Nota operativa: questo primo deploy è stato eseguito con upload CLI della
sola cartella `mobile/`:

```bash
railway up ./mobile --path-as-root \
  -p dcc0f003-69c5-4d3d-86d1-2e102d0f683d \
  -e 711d34ed-a401-4a03-9d37-7868365ad48a \
  -s a9fb80ff-f834-4e78-bf65-682843b08b26 --detach
```

La CLI non ha persistito `source.rootDirectory=mobile`. Per evitare deploy
GitHub automatici destinati a fallire dalla root del monorepo, la source
GitHub del solo servizio `mobile-web` è stata scollegata dopo il deploy CLI.
Il deploy SUCCESS e il dominio restano attivi. Per riattivare gli autodeploy:
collegare `marioneivory/kill-doku`, branch `main`, impostare dalla dashboard
Settings → Source → Root Directory = `mobile` e verificare che Railway rilevi
`/mobile/railway.json`.

## 6. Verifiche locali

Backend:

```bash
cd backend
npm install
npm run build
NODE_ENV=test \
DATABASE_URL=postgresql://u:p@localhost:5432/db \
JWT_SECRET=test-access-secret-123456789 \
JWT_REFRESH_SECRET=test-refresh-secret-987654321 \
npm test
```

Risultato: 5 suite, 32 test, tutti verdi.

Mobile:

```bash
cd mobile
npm install
npm run typecheck
EXPO_PUBLIC_API_URL=https://backend-production-59ea.up.railway.app npm run build
```

Risultato: typecheck e export web riusciti. Lo script `npm run lint` non è
attualmente eseguibile perché nel repository manca una configurazione ESLint;
questa è una discrepanza rispetto al vecchio handoff che lo indicava verde.

## 7. Prossimi passi, in ordine

1. Impostare dalla dashboard la Root Directory `mobile` sul servizio
   `mobile-web`, poi verificare un autodeploy GitHub completo.
2. Test funzionale più ampio dell'app web: login, capitoli, generazione e
   soluzione di un puzzle contro il backend reale.
3. Sostituire le etichette testuali della griglia con vere illustrazioni.
4. Configurare un account EAS reale e generare build iOS/Android installabili.
5. Aggiungere configurazione ESLint e test di integrazione database/API.

## 8. Note tecniche

- Backend e mobile sono nello stesso repository ma hanno `package.json`
  indipendenti.
- La soluzione dei puzzle resta solo server-side.
- I puzzle Storia sono deterministici e condivisi; i Random sono nuovi a
  ogni richiesta.
- Il seed dei 6 badge è idempotente e viene eseguito a ogni avvio backend.
- L'URL API è incorporato nell'export Expo tramite
  `EXPO_PUBLIC_API_URL=https://backend-production-59ea.up.railway.app`.
