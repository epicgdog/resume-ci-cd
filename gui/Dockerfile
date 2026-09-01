FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/resume.json /app/resume.default.json
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint-resume.sh /docker-entrypoint.d/40-seed-resume.sh
RUN chmod +x /docker-entrypoint.d/40-seed-resume.sh

EXPOSE 80
