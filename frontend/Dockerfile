# ===========================================================================
# Story Scout - Frontend image
# Build the Vite app, then serve the static bundle with nginx.
# ===========================================================================

# ---- Builder ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

# The bundle calls the backend via the nginx /api proxy (same origin).
ENV VITE_API_BASE_URL=/api
RUN npm run build

# ---- Runtime ----
FROM nginx:1.27-alpine AS runtime

# SPA + API proxy config.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
