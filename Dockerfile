FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# prisma.config.ts validates DATABASE_URL when it is loaded. The generated
# client is URL-agnostic (the adapter is created at runtime), so a throwaway
# value is enough for code generation during the image build.
RUN DATABASE_URL="mysql://build:build@127.0.0.1:3306/build" npm run db:generate && npm run build

ENV NODE_ENV=production

EXPOSE 5000

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
