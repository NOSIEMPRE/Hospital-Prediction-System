# Stage 1: Build React Client
FROM node:24-alpine as builder
WORKDIR /app
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Serve via Node.js Express proxy
FROM node:24-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server/ ./

# Copy built react files from stage 1 into our server project
# (Our Express index.js serves client/dist in production)
RUN mkdir -p ../client
COPY --from=builder /app/dist ../client/dist

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "src/index.js"]
