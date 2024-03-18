FROM node:21.5.0

WORKDIR /app

COPY package*.json /app/

RUN npm install

COPY . /app

RUN npm run build

# Serve using serve package
RUN npm install -g serve
CMD ["serve", "-s", "build", "-l", "3000"]

