# Single-service deploy: the NestJS API also serves the built React app.
FROM node:20-bookworm AS build
WORKDIR /app
COPY server/package*.json server/
RUN cd server && npm ci
COPY client/package*.json client/
RUN cd client && npm ci
COPY server server
COPY client client
RUN cd server && npm run build && npm prune --omit=dev
RUN cd client && npm run build

FROM node:20-bookworm-slim
ENV NODE_ENV=production PORT=3000 DB_PATH=/data/app.db CLIENT_DIST=/app/client/dist
WORKDIR /app
COPY --from=build /app/server/dist server/dist
COPY --from=build /app/server/node_modules server/node_modules
COPY --from=build /app/server/package.json server/
COPY --from=build /app/client/dist client/dist
RUN mkdir -p /data
EXPOSE 3000
CMD ["node", "server/dist/main.js"]
