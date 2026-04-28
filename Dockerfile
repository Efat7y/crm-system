FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 8080
ENV PORT=8080
CMD ["node", "server.js"]
