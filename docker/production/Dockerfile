# ==== BUILD =====
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
COPY . .
# Type-check and build the static bundle into /app/dist
RUN npm run build

# ==== RUN =======
# Serve the static bundle with nginx (SPA fallback, gzip, immutable asset caching)
FROM nginx:1.27-alpine
COPY docker/production/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/ >/dev/null || exit 1
