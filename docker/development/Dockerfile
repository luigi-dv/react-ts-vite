# ==== CONFIGURE =====
# Node 24 (Active LTS) on Alpine
FROM node:24-alpine
# Set the working directory to /app inside the container
WORKDIR /app
# ==== INSTALL =====
# Copy the manifests first so dependency layers are cached between builds
COPY package.json package-lock.json* ./
# npm ci installs the exact versions from the lockfile
RUN npm ci --ignore-scripts
# Copy the rest of the app (mounted as a volume by docker-compose for hot reload)
COPY . .
# ==== RUN =======
ENV NODE_ENV=development
# Vite dev server port (see vite.config.ts)
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
