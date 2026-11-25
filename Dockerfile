FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Prisma reads DATABASE_URL from schema.prisma. The generated client is
# URL-agnostic, so a dummy MySQL URI is enough for code generation here.
RUN DATABASE_URL="mysql://root:placeholder@127.0.0.1:3306/hostel_allocation_db" npm run db:generate && npm run build

ENV NODE_ENV=production

EXPOSE 5000 10000

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
