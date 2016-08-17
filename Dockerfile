FROM node:4.4
MAINTAINER Jan Blaha
EXPOSE 5488

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY . /usr/src/app

EXPOSE 5488
CMD [ "node", "index.js" ]