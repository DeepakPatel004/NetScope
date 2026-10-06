FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY src/ ./src/

ENV NODE_ENV=production

# Probes require zero inbound open ports. Communication is 100% outbound HTTPS.

CMD ["node", "src/index.js"]
