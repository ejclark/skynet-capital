# Live observatory server — runs the SSE dashboard + Alpaca streams.
FROM node:24-slim

WORKDIR /app

# Install deps first for layer caching. Dev deps (tsx) are needed at runtime.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build the Babylon scene bundle. This MUST come after `COPY . .` — it needs src/three/**, which
# doesn't exist during the earlier `npm ci` layer. (Putting it in package.json's `prepare` broke the
# image build for exactly that reason.)
RUN npm run build:scene

# Default port; hosting platforms that inject PORT override it via resolvePort().
EXPOSE 8787

CMD ["npm", "run", "serve:dashboard"]
