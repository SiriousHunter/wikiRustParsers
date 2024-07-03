# syntax=docker/dockerfile:1
FROM node:lts-alpine

COPY package.json ./

RUN npm install

COPY . .

RUN crontab cron

CMD ["crond", "-f"]
