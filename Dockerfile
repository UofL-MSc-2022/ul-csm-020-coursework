FROM node:18 as base
WORKDIR /usr/mini-wall/src
COPY package*.json ./
RUN npm install
COPY . .
USER node

FROM base as app
EXPOSE 3000
CMD [ "npm", "start" ]

FROM base as test
CMD [ "npm", "test" ]
