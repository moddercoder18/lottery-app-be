# Base image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

COPY .yarn ./.yarn

COPY .yarnrc.yml ./.yarnrc.yml
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

COPY .env.staging ./.env
# Install app dependencies
RUN yarn install

# Bundle app source
COPY . .

# Creates a "dist" folder with the production build
RUN yarn build

# Start the server using the production build
CMD [ "node", "dist/main.js" ]