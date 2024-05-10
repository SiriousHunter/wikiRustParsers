# syntax=docker/dockerfile:1
FROM node:lts-alpine

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN crontab cron

CMD ["crond", "-f"]
