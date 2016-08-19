FROM node:4.4
MAINTAINER Jan Blaha
EXPOSE 5488

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

RUN mkdir /run-data

COPY . /usr/src/app

EXPOSE 5488
CMD [ "sudo", "node", "index.js" ]