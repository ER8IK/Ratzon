FROM node:22-slim

WORKDIR /app

# Копируем dependency metadata и устанавливаем зависимости
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack pnpm install --frozen-lockfile

# Копируем сервис
COPY . .

EXPOSE 3000

CMD ["corepack", "pnpm", "start"]
