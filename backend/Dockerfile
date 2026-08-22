# --- Stage 1: build ---------------------------------------------------------
FROM node:20-slim AS builder

WORKDIR /app

# openssl è richiesto a runtime dal motore Prisma su immagini Debian-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY prisma ./prisma

RUN npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# --- Stage 2: runtime --------------------------------------------------------
FROM node:20-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Solo dipendenze di produzione, poi rigenera il client Prisma per il
# target runtime corretto (i binari differiscono da quelli usati in build).
RUN npm install --omit=dev --no-audit --no-fund && npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000

# Applica le migration pendenti e poi avvia il server. In caso di primo
# deploy su un DB vuoto, `migrate deploy` crea lo schema da zero.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
