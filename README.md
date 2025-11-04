HelpFinder Monorepo

Overview
- Web and API split for scalable growth.
- Initial domain: Users, Tasks, Bids, Contracts.
- Local stack via Docker: Postgres + Redis.

Structure
- apps/web: Next.js web app (SPA/SSR-ready)
- services/api: NestJS REST API with Swagger
- packages/contracts: OpenAPI contracts for public API

Quick Start
1) Prereqs: Node 18+, npm 9+, Docker
2) Start infra: docker compose up -d
3) Install deps: npm install
4) Dev API: npm run dev:api (env in services/api/.env)
5) Dev Web: npm run dev:web (env in apps/web/.env.local)

Env
- services/api/.env
  DATABASE_URL=postgres://postgres:postgres@localhost:5432/helpfinder
  REDIS_URL=redis://localhost:6379
  JWT_SECRET=replace-with-strong-secret
  PORT=4000

- apps/web/.env.local
  NEXT_PUBLIC_API_BASE=http://localhost:4000

Notes
- API exposes Swagger at /docs in dev.
- OpenAPI contract at packages/contracts/openapi/openapi.yaml.
- This is a starter; expand modules, validations, and auth as you go.

