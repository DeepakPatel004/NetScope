FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install || echo "No package.json yet, skipping install"

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]