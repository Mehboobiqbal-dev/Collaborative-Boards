FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev && npm cache clean --force

COPY . .

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
