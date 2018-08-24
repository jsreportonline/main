FROM ubuntu:bionic
MAINTAINER Jan Blaha

RUN apt-get update && apt-get install -y curl sudo git gnupg bzip2 && \
    curl -sL https://deb.nodesource.com/setup_8.x | bash - && \
    apt-get update && \
    apt-get install -y --no-install-recommends nodejs docker.io && \
    npm i -g npm

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
