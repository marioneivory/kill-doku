# Kill-Doku — Architettura

Panoramica delle scelte tecniche e di come i due repository (`backend/` e
`mobile/`) comunicano tra loro.

## Struttura del monorepo

```
kill-doku/
  backend/    API Node.js/TypeScript/Express + Prisma/PostgreSQL
  mobile/     App Expo/React Native/TypeScript
  ARCHITECTURE.md   (questo file)
```

I due progetti sono indipendenti (package.json separati, deploy separati)
ma condividono un contratto implicito: le interfacce TypeScript in
`mobile/src/types/api.ts` rispecchiano manualmente le DTO esposte da
`backend/src/services/puzzleService.ts` e dai controller. Non c'è
generazione automatica di tipi condivisi in questa prima versione — è
un'estensione naturale futura (es. pacchetto `shared/` con gli enum e le
interfacce comuni, o codegen OpenAPI).

## Comunicazione backend ↔ mobile

- Protocollo: REST su HTTP/JSON.
- L'app mobile punta al backend tramite la variabile pubblica Expo
  `EXPO_PUBLIC_API_URL` (vedi `mobile/.env.example`), configurabile per
  puntare a `localhost` in sviluppo o all'URL pubblico Railway in produzione.
- Autenticazione: JWT access token (short-lived, 15 min di default) nell'header
  `Authorization: Bearer <token>`, più un refresh token long-lived
  (30 giorni di default) usato per ottenere nuovi access token senza
  richiedere nuovamente le credenziali. Il refresh avviene automaticamente
  lato client tramite un interceptor Axios (`mobile/src/api/client.ts`) che
  intercetta le risposte 401, tenta un refresh e ripete la richiesta
  originale una sola volta.
- I token sono persistiti sul device con `expo-secure-store` (keychain/
  keystore nativo), mai in AsyncStorage in chiaro.
- Rotazione dei refresh token: ad ogni refresh, il token usato viene
  revocato lato server e ne viene emesso uno nuovo (tabella
  `RefreshToken` in Prisma), per limitare il danno in caso di furto token.

## Motore di generazione puzzle — perché è isolato

`backend/src/engine/` non ha alcuna dipendenza da Express, Prisma o HTTP:
prende in input una difficoltà (+ opzionalmente un seed) e restituisce una
struttura dati puzzle pura (`PuzzleGenerationResult`). Questo isolamento
permette di:
- testarlo in modo deterministico e velocissimo con Jest, senza DB;
- riusarlo identico sia per la modalità Storia (seed deterministico
  `chapterNumber*100000 + levelNumber`, così tutti gli utenti che giocano
  lo stesso livello vedono lo stesso puzzle) sia per la modalità Random
  (seed casuale, un puzzle diverso ogni volta);
- eventualmente estrarlo in futuro come pacchetto npm standalone se
  servisse, ad esempio, generare puzzle anche lato client per un modo
  "offline".

Pipeline (`puzzleGenerator.ts`): genera griglia+aree → genera un
piazzamento valido (una riga/una colonna per personaggio) → assegna
vittima e assassino (stessa area, nessun altro presente) → deriva un pool
di indizi veri per ciascun personaggio → seleziona incrementalmente il
sottoinsieme minimo di indizi che rende la soluzione unica (verificato con
un solver CSP a backtracking con euristica MRV + forward checking) → pota
gli indizi ridondanti residui. Se in qualunque punto la generazione fallisce
(nessuna soluzione valida, unicità irraggiungibile), l'intero tentativo
viene scartato e si riparte da capo, fino a un tetto di tentativi.

## Perché il solver non riceve mai la soluzione

Il modulo `solver.ts` verifica l'unicità lavorando **solo** su griglia +
indizi strutturati (`ClueConstraint[]`), esattamente come farebbe un
giocatore umano — mai sulla soluzione stessa. Questo garantisce che, se il
solver conclude "soluzione unica", quella conclusione sia una proprietà
reale del puzzle così come verrà presentato al giocatore, non un artefatto
di come è stato generato. La stessa logica di valutazione vincoli
(`evaluateConstraint` in `clueGenerator.ts`) è condivisa tra generazione e
verifica, cosa che elimina per costruzione ogni possibile disallineamento
tra "indizio mostrato" e "indizio verificato".

## Cache dei puzzle (Storia vs Random)

- **Storia**: il puzzle di un dato livello viene generato una sola volta
  (alla prima richiesta di un qualunque utente) e persistito in tabella
  `Puzzle` con `mode=STORY, chapterNumber, levelNumber` come chiave
  logica unica. Le richieste successive per lo stesso livello (da
  qualunque utente) restituiscono il record già in cache. Questo rende la
  modalità Storia "condivisa": tutti risolvono esattamente lo stesso
  mistero per un dato livello.
- **Random**: ogni chiamata a `GET /random/new` genera e persiste un
  nuovo record `Puzzle` con `mode=RANDOM` (seed casuale, mai riusato).

## Sicurezza della soluzione

La soluzione (`solutionRow`/`solutionCol` per personaggio, più i vincoli
strutturati in `Puzzle.solutionData`) non lascia mai il server: i DTO
serializzati per il client (`serializePuzzleForClient`) espongono solo
`clueText`, `isVictim` e la struttura della griglia — mai `isKiller` né le
coordinate soluzione. La validazione di un tentativo (`validateSubmission`)
confronta server-side il piazzamento inviato dal client (per `characterId`,
non per indice posizionale, per evitare bug di ordinamento) con i valori
memorizzati, e rivela l'identità dell'assassino nella risposta solo se il
tentativo è interamente corretto.

## Frontend — organizzazione

- **Tema**: palette "detective noir" definita in `mobile/src/theme/palette.ts`
  (valori esatti dark/light), applicata via `ThemeContext` che risolve tema
  utente salvato → tema di sistema come fallback al primo accesso.
- **Navigazione**: `RootNavigator` sceglie tra `AuthNavigator` (login/
  registrazione/recupero password) e `MainTabNavigator` (5 tab: Home,
  Storia, Random, Profilo, Impostazioni) in base allo stato di
  autenticazione in `authStore` (zustand).
- **Stato**: due store zustand principali — `authStore` (sessione utente,
  tema) e `puzzleStore` (piazzamento in corso su un puzzle aperto). Le
  chiamate API restano fuori dagli store quando possibile (in `src/api/`),
  per mantenere gli store come semplice stato + orchestrazione minima.
- **Componente puzzle condiviso**: `PuzzleBoard` (griglia + pannello
  indizi + verifica + esito) è usato identico sia da `StoryPuzzleScreen`
  sia da `RandomPuzzleScreen`, che differiscono solo per come recuperano/
  inviano i dati (endpoint Storia vs Random) e cosa fanno dopo un esito
  positivo (Storia: torna alla lista livelli; Random: carica un nuovo
  puzzle).
- **Animazioni progressi**: la barra di progresso usa
  `react-native-reanimated` (thread nativo); il contatore numerico usa un
  tween JS via `requestAnimationFrame` (scelta pragmatica, documentata nel
  codice, perché animare il *contenuto testuale* con reanimated richiede
  boilerplate aggiuntivo non giustificato per un semplice contatore); la
  celebrazione allo sblocco badge è un effetto "particelle" costruito con
  reanimated, sostituto degli asset Lottie (non forniti nel progetto) —
  sostituibile 1:1 con `lottie-react-native` in futuro senza toccare i
  punti di chiamata.

## Limitazioni note dell'ambiente di sviluppo corrente

- Il modulo `@prisma/client` richiede `npx prisma generate`, che scarica
  binari da `binaries.prisma.sh`. In ambienti con restrizioni di rete
  (come la sandbox usata per scrivere questo codice) quel dominio non è
  raggiungibile e il comando fallisce con 403. Non è un problema del
  codice: funziona normalmente in locale o su Railway. Documentato anche
  in `backend/README.md`. Di conseguenza, la suite di test backend
  copre tutto ciò che non dipende dal client Prisma (motore puzzle,
  utility auth, validators, config) — 32 test verdi — ma non i service
  che toccano il DB, che richiedono un'istanza Postgres reale.
- Le schermate mobile non hanno ancora ricevuto una sessione di test di
  integrazione end-to-end contro un backend realmente deployato (solo
  typecheck + lint puliti finora — entrambi a zero errori).
- Gli oggetti/arredi e i personaggi sono renderizzati con etichette
  testuali/colori per area invece di vere icone piatte illustrate (punto 9
  della spec): la struttura dati (`objectKey`) è già pronta per essere
  mappata a asset grafici reali quando disponibili, senza cambiare la
  logica del motore. L'icona app, l'adaptive icon Android e la splash
  screen sono invece già presenti (`mobile/assets/`), generate a tema
  (antracite + oro, motivo lente d'ingrandimento).

## Prossimi passi consigliati

1. Test di integrazione mobile↔backend con un'istanza reale (Railway o
   locale con Postgres via Docker).
2. Asset grafici reali per oggetti/personaggi (sostituendo le etichette
   testuali in `PuzzleGrid.tsx`).
3. EAS Build per generare binari iOS/Android installabili.
4. Eventuale pacchetto `shared/` con i tipi/enum condivisi tra backend e
   mobile, per eliminare la duplicazione manuale attuale.
