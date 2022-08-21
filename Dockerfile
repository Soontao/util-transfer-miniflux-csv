FROM node:lts-alpine

WORKDIR /usr/src/app
COPY package.json .
COPY package-lock.json .
RUN npm ci
COPY . .

ENV PORT 3000
ENV LOG_LEVEL info
ENV LOG_TIME abs

EXPOSE 3000

CMD [ "node", "server.mjs" ]
