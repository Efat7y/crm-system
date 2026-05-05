FROM node:20-slim

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 8080
ENV PORT=8080
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "8080"]
