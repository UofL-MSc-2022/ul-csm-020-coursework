FROM node:18
WORKDIR /usr/mini-wall/src
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD [ "npm", "start" ]
