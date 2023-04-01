# Use Node v18
FROM node:18 as base
WORKDIR /usr/mini-wall/src
# First copy the package files in order to run npm install in a clean
# environment.
COPY package*.json ./
RUN npm install
# Next copy everything else.
COPY . .
# Use the non-root user created by the node image above.
USER node

# All deployable stages use the start command.
FROM base as base-app
CMD ["npm", "start"]

# The prod app uses the .env-prod file and port 3000.
FROM base-app as prod-app
COPY .env-prod .env
EXPOSE 3000

# The test app uses the .env-test file and port 4000.
FROM base-app as test-app
COPY .env-test .env
EXPOSE 4000

# The test suite does not need a start command, nor do any ports need to be
# exposed.  It does need the .env-test file, however.
FROM base as test-suite
COPY .env-test .env
CMD ["npm", "test"]
