FROM node:18 as base
WORKDIR /usr/mini-wall/src
COPY package*.json ./
RUN npm install
COPY . .
USER node

FROM base as base-app
CMD [ "npm", "start" ]

FROM base-app as prod-app
COPY .env-prod .env
EXPOSE 3000

FROM base-app as test-app
COPY .env-test .env
EXPOSE 4000

FROM base as test-suite
COPY .env-test .env
CMD [ "npm", "test" ]
