# Kill-Doku — Mobile (Expo / React Native / TypeScript)

App mobile del gioco di deduzione Kill-Doku. Consuma le API del backend
(`../backend`) per autenticazione, modalità Storia e modalità Random.

## Stack

- Expo (React Native) + TypeScript
- `@react-navigation` (stack + bottom tabs)
- `zustand` per lo state management
- `axios` con refresh JWT automatico
- `expo-secure-store` per la persistenza sicura dei token
- Tema dark/light "detective noir" con font Google Fonts (Playfair Display + Inter)
- `react-native-reanimated` per le animazioni della schermata Profilo

## Struttura

```
src/
  api/          client axios, token storage, funzioni per endpoint
  components/   componenti UI riusabili (Button, Card, PuzzleGrid, ...)
  navigation/   Auth/Story/Random stack + tab principale
  screens/      schermate raggruppate per area
  store/        stato globale zustand (auth, puzzle in corso)
  theme/        palette, font, ThemeContext
  types/        tipi che rispecchiano le DTO del backend
```

## Avvio in sviluppo

Prerequisiti: Node.js 20+, Expo CLI (`npx expo`, non serve installazione
globale), un backend Kill-Doku raggiungibile (vedi `../backend/README.md`).

```bash
cp .env.example .env
# imposta EXPO_PUBLIC_API_URL con l'URL del backend (locale o Railway)
npm install
npx expo start
```

Poi scegli target da terminale/Expo Dev Tools:
- `i` → simulatore iOS (richiede Xcode, solo macOS)
- `a` → emulatore Android (richiede Android Studio)
- scansiona il QR code con l'app **Expo Go** per testare su device fisico
  (in tal caso `EXPO_PUBLIC_API_URL` deve puntare a un host raggiungibile
  dal telefono, non `localhost`)

> Nota: `react-native-reanimated` richiede il plugin Babel già configurato
> in `babel.config.js`. Se cambi quel file, riavvia Metro con `--clear`.

## Build

Per build installabili (development build o produzione), questo progetto
è pronto per **EAS Build** — `eas.json` è già presente con 3 profili
(`development`, `preview`, `production`):

```bash
npm install -g eas-cli   # oppure npx eas-cli
eas login
eas build:configure      # collega/crea il progetto EAS, aggiorna il projectId
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

Prima del primo build, aggiorna in `eas.json` i placeholder
`REPLACE_WITH_YOUR_RAILWAY_URL` nei profili `preview`/`production` con
l'URL reale del backend deployato, e aggiorna `extra.eas.projectId` in
`app.json` con l'ID generato da `eas build:configure` (per ora contiene
un placeholder).

## Collegamento al backend

L'app legge l'URL del backend da `EXPO_PUBLIC_API_URL` (variabile pubblica
Expo, quindi va bene solo per l'URL — mai per segreti). Dopo il deploy del
backend su Railway, aggiorna `.env` con l'URL pubblico assegnato, es.:

```
EXPO_PUBLIC_API_URL=https://kill-doku-backend.up.railway.app
```

## Cosa manca / prossimi passi

Le schermate coprono tutti i flussi richiesti (auth, home, mappa capitoli,
puzzle, random, profilo, impostazioni), ma non è ancora stata fatta una
sessione di test di integrazione end-to-end contro un backend realmente
deployato — da fare come step successivo, insieme a un vero set di icone/
illustrazioni piatte per oggetti e personaggi (per ora la griglia usa
colori per area ed etichette testuali, in stile "wireframe pulito").

Già pronti: icona app, adaptive icon Android e splash screen a tema
(`assets/`), configurazione EAS Build (`eas.json`) con profili
development/preview/production.
