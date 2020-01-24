FROM node:10.18.1

LABEL maintainer="daniel.young@bluefrontier.co.uk"

WORKDIR /app

COPY package.json yarn.lock ./

RUN npm install -g yarn --force

RUN yarn

COPY . .

CMD ["yarn", "start"]
