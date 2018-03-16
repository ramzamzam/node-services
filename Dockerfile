FROM ubuntu:14.04

RUN apt-get update
RUN apt-get install --yes curl git build-essential
RUN curl --silent --location https://deb.nodesource.com/setup_8.x | sudo bash -
RUN apt-get install --yes nodejs
RUN node -v

ENV NODE_ENV production
WORKDIR /usr/src/app
COPY ["package.json", "./"]
RUN npm install --silent --production
COPY . .

