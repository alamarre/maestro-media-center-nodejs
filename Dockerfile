FROM node:8

RUN mkdir -p /opt/maestro
WORKDIR /opt/maestro

ADD package.json .

VOLUME ["/opt/maestro/db", "/Movies"]

RUN npm install --production
ADD src ./src

EXPOSE 3000

ENTRYPOINT ["node", "src/index.js"]