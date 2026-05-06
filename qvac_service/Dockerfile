FROM node:22-slim

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json ./
RUN npm install

# Копируем сервис
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]