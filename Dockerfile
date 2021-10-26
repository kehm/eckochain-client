FROM node:14.18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN apk add python3 make g++
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
