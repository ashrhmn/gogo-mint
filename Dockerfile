FROM node:16-alpine3.14 as builder

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN apk add git
RUN yarn

COPY . .
# ENV DATABASE_URL mysql://root:deepchainlabs@103.49.201.228:3306/dcl_nft_marketplace
RUN yarn build

FROM node:16-alpine3.14

COPY --from=builder /app/.next/standalone/. /app/.
COPY --from=builder /app/.next/static/. /app/.next/static/.
COPY --from=builder /app/public/. /app/public/.

WORKDIR /app

ARG PORT

# ENV DATABASE_URL mysql://root:deepchainlabs@103.49.201.228:3306/dcl_nft_marketplace

ENV PORT "${PORT}"


EXPOSE "${PORT}"

CMD ["node","server.js"]

