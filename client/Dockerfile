FROM node:24.20.0-alpine AS dependencies

WORKDIR /app

COPY package*.json ./
RUN npm ci

FROM node:24.20.0-alpine AS development

WORKDIR /app
ENV NODE_ENV=development
ENV PATH=/app/node_modules/.bin:$PATH

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .
USER node

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

FROM dependencies AS production-build

ARG VITE_API_BASE_URL=http://localhost:14322/api/v1
ARG VITE_SOCKET_URL=http://localhost:14322
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=production-build /app/dist /usr/share/nginx/html

EXPOSE 80
