FROM node:24.20.0-alpine AS dependencies

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:24.20.0-alpine AS development

WORKDIR /app
ENV NODE_ENV=development
ENV PATH=/app/node_modules/.bin:$PATH

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
COPY --chown=node:node prisma ./prisma
USER node
RUN DATABASE_URL="postgresql://autocore:autocore_dev_password@db:5432/autocore?schema=public" npm run prisma:generate

COPY --chown=node:node . .

EXPOSE 8000
CMD ["npm", "run", "dev"]

FROM node:24.20.0-alpine AS production-build

WORKDIR /app

COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN DATABASE_URL="postgresql://autocore:autocore_dev_password@db:5432/autocore?schema=public" npm run prisma:generate
COPY . .
RUN npm prune --omit=dev

FROM node:24.20.0-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY --from=production-build --chown=node:node /app ./
USER node

EXPOSE 8000
CMD ["node", "app.js"]
