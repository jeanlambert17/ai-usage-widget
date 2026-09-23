# Multi-stage: build the React/shadcn frontend, then run just the Express
# backend serving its built output. The desktop-only pieces (electron/,
# assets/, scripts/) never enter either stage.

FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app/backend

COPY backend/package.json ./
RUN npm install --omit=dev

COPY backend/ ./
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Pre-create the data dir (holds accounts.json, mounted as a volume) and hand
# the whole app dir to the non-root `node` user baked into this base image.
RUN mkdir -p data && chown -R node:node /app
USER node

ENV PORT=4173
EXPOSE 4173

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- "http://localhost:${PORT}/api/accounts" || exit 1

CMD ["node", "src/server.js"]
