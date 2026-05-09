FROM node:22-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && corepack pnpm install --frozen-lockfile

COPY . .
RUN corepack pnpm build

ENV NODE_ENV=production

EXPOSE 4000

CMD ["corepack", "pnpm", "start"]
