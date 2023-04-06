FROM node:16-alpine3.14 as builder

WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn
COPY . .
RUN yarn build

FROM node:16-alpine3.14

RUN yarn global add pm2

COPY --from=builder /app/.next/standalone/. /app/.
COPY --from=builder /app/.next/static/. /app/.next/static/.
COPY --from=builder /app/public/. /app/public/.
WORKDIR /app
ARG PORT
ENV PORT "${PORT}"
EXPOSE "${PORT}"
CMD ["pm2-runtime -i max server.js --name gogo-mint"]