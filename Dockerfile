FROM node:4.4
MAINTAINER Jan Blaha
EXPOSE 5488

RUN apt-get update && apt-get install -y sudo
RUN apt-get install docker.io -y

RUN npm install npm -g

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

RUN mkdir /run-data

COPY . /usr/src/app

EXPOSE 5488
CMD [ "node", "index.js" ]