# Build context is the repository root (../../ from environment/prod).
FROM node:22-alpine AS build
WORKDIR /web
COPY projects/frontend/package.json ./
RUN npm install --no-audit --no-fund
COPY projects/frontend/index.html projects/frontend/vite.config.js ./
COPY projects/frontend/public ./public
COPY projects/frontend/src ./src
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
RUN rm -f /etc/nginx/conf.d/default.conf
COPY projects/gateway/nginx.conf /etc/nginx/nginx.conf
COPY projects/gateway/errors/404.html projects/gateway/errors/503.html /usr/share/nginx/html/
COPY --from=build /web/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]