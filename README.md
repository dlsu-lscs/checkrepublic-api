# checkrepublic-api

Fastify API with Prisma and PostgreSQL.

API prefix: `/api`.

Copy `.env.example` to `.env` and configure the database credentials and `DATABASE_URL`.

```sh
npm install
docker compose up -d db
npx prisma migrate deploy
npx prisma generate
npm run dev
```

For sample development data, run `npm run prisma:seed` after applying migrations.
It creates 10 users and 20 linked projects, prints their IDs, and can be rerun without
creating duplicates.

Stop PostgreSQL (keeps database data):

```sh
docker compose stop db
```

Checks (integration tests require PostgreSQL):

```sh
npm test
npm run test:integration
npm run build
npm run lint
```

See [Prisma commands and migrations](docs/prisma.md).
