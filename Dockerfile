FROM node:22 AS base
LABEL version="1.0.0"
LABEL maintainer="Fox_score"


FROM base AS builder
WORKDIR /src

COPY package*.json ./
RUN npm install --frozen-lockfile

COPY . .
RUN npm run build


FROM base AS runner
WORKDIR /app
COPY --from=builder /src/dist/ ./dist/
COPY --from=builder /src/package*.json ./
RUN npm install --frozen-lockfile --omit=dev

ENTRYPOINT ["node", "/app/dist/src/index.js"]
CMD []
