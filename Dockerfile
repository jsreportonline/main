FROM mhart/alpine-node
MAINTAINER Jan Blaha
EXPOSE 5488

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install --production

RUN mkdir /tmp/jsreport

COPY . /usr/src/app
COPY patch /usr/src/app

EXPOSE 5488

HEALTHCHECK CMD curl --fail http://localhost:5488 || exit 1

CMD [ "node", "index.js" ]