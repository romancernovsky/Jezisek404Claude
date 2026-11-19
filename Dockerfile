# Ježíšek 404 — production image (local Docker and Google Cloud Run)
# Zero npm dependencies: the image is just Node + the app files.
FROM node:22-alpine

ENV NODE_ENV=production \
    PORT=8080 \
    STATE_FILE=/app/data/show-state.json

WORKDIR /app
COPY package.json ./
COPY server ./server
COPY shared ./shared
COPY public ./public

# Writable directory for the persisted show state (a volume locally, optional GCS mount on Cloud Run)
RUN mkdir -p /app/data && chown -R node:node /app/data
USER node

EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||8080)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Node is PID 1 and handles SIGTERM itself (saves state, closes connections).
CMD ["node", "server/index.js"]
