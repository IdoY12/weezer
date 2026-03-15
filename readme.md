# WEEZER

## Project Overview
Weezer is a full-stack social platform with authentication, user profiles, follows, posts, comments, messaging, media uploads, and real-time event delivery.  
The backend exposes a REST API with JWT auth and OAuth (Google), communicates with Socket.IO for live updates, and uses MySQL for persistence.  
LocalStack is used to emulate S3 locally for media storage workflows. Stripe and OpenAI integrations are present in the backend/frontend code paths.

## Project Structure
`backend/` - Express + TypeScript API, auth, social graph, feed, messaging, Stripe/OpenAI endpoints  
`frontend/` - React + Vite client, auth UI, feed/profile/messaging UI, Socket.IO client integration  
`io/` - Socket.IO server (real-time event hub between backend and clients)  
`database/` - MySQL Docker image and SQL seed (`weezer.sql`)  
`lib/socket-enums/` - shared Socket.IO event enums package  
`docker-compose.yaml` - compose orchestration for database, localstack, io, backend, frontend  

## Architecture and Dependencies
1. Start infrastructure first: `database` (MySQL) and `localstack` (S3 emulation).
2. Start `io` (Socket.IO server).
3. Start `backend` (depends on DB, S3 endpoint, and Socket.IO host/port).
4. Start `frontend` (depends on backend REST URL and Socket.IO URL).

Service connectivity:
- Backend DB connection is controlled by config (`db.host`, `db.port`) and `NODE_ENV`/`NODE_CONFIG`.
- Backend S3 endpoint is `http://localhost:4566` in local defaults and `http://localstack:4566` in compose mode.
- Backend connects to Socket.IO via `io.host` + `io.port`.
- Frontend consumes backend and io URLs via `VITE_*` variables (especially in `docker run` mode).

## Prerequisites
- Node.js `24.12.0` (project Dockerfiles use Node 22 Alpine; Node 22+ is recommended)
- npm `11.6.2`
- Docker Engine `29.1.3`
- Docker Compose `v2.40.3`
- `curl`
- `python3` (used in JWT extraction snippets)

Quick version check:
```bash
node -v
npm -v
docker --version
docker compose version
python3 --version
curl --version
```

## Seeded Test Users
The seeded users are loaded from `database/weezer.sql`.

| Username | Password |
|---|---|
| `bob000` | `123456` |
| `alice0` | `123456` |
| `charlie` | `123456` |
| `gustav` | `123456` |
| `diana0` | `123456` |

## Run Mode 1: Local Development (npm)

Install dependencies:
```bash
npm install --prefix backend
npm install --prefix io
npm install --prefix frontend
```

Start infrastructure with Docker:
```bash
docker build -t weezer-run-database ./database
docker run -d --name weezer-run-database \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=1 \
  -e MYSQL_DATABASE=weezer \
  -e MYSQL_TCP_PORT=3306 \
  -p 3308:3306 \
  weezer-run-database

docker run -d --name weezer-run-localstack -p 4566:4566 localstack/localstack
```

Start app services (three terminals):
```bash
# terminal 1
npm run dev --prefix io

# terminal 2
npm run dev --prefix backend

# terminal 3
npm run dev --prefix frontend
```

Verify end-to-end:
```bash
curl -I http://localhost:5173
curl -s http://localhost:4566/_localstack/health
curl -s 'http://localhost:3004/socket.io/?EIO=4&transport=polling'

JWT=$(curl -s -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"bob000","password":"123456"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("token") or d.get("jwt") or d.get("accessToken") or "")')

curl -s http://localhost:3000/users/me -H "Authorization: Bearer $JWT"
curl -s http://localhost:3000/feed -H "Authorization: Bearer $JWT"
```

## Run Mode 2: Individual Containers (docker run)

Build images:
```bash
docker build -t weezer-backend ./backend
docker build -t weezer-io ./io
docker build -t weezer-frontend ./frontend
docker build -t weezer-database ./database
```

### Option A - Shared Docker network
Create network:
```bash
docker network create weezer-net
```

Run services with aliases (`weezer-run-` prefix):
```bash
docker run -d --name weezer-run-database \
  --network weezer-net --network-alias database \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=1 \
  -e MYSQL_DATABASE=weezer \
  -e MYSQL_TCP_PORT=3306 \
  -p 3308:3306 \
  weezer-database

docker run -d --name weezer-run-localstack \
  --network weezer-net --network-alias localstack \
  -p 4566:4566 \
  localstack/localstack

docker run -d --name weezer-run-io \
  --network weezer-net --network-alias io \
  -p 3022:3004 \
  weezer-io

docker run -d --name weezer-run-backend \
  --network weezer-net --network-alias backend \
  --env-file .secret \
  -e NODE_ENV=compose \
  -p 3020:3000 \
  weezer-backend

docker run -d --name weezer-run-frontend \
  --network weezer-net --network-alias frontend \
  -e VITE_REST_SERVER_URL=http://backend:3000 \
  -e VITE_IO_SERVER_URL=http://io:3004 \
  -e VITE_GOOGLE_SERVER_URL=http://backend:3000/auth/google \
  -e VITE_S3_URL=https://images.weezer.com.s3.amazonaws.com/ \
  -e VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SgqgYISFdCWx0atQ84SNI5P2uiTrB3c8NvAgtuvhUKd2OlxWPNwaFhnWfYUHnhGIVkyz8paW9utyLxO7PEIlCw400huOeQ85C \
  -p 3013:5173 \
  weezer-frontend
```

Verify end-to-end:
```bash
docker logs --tail=50 weezer-run-database
docker logs --tail=50 weezer-run-localstack
docker logs --tail=50 weezer-run-io
docker logs --tail=50 weezer-run-backend
docker logs --tail=50 weezer-run-frontend

curl -I http://localhost:3013
curl -s 'http://localhost:3022/socket.io/?EIO=4&transport=polling'
curl -s http://localhost:4566/_localstack/health

JWT=$(curl -s -X POST http://localhost:3020/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"alice0","password":"123456"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("token") or d.get("jwt") or d.get("accessToken") or "")')

curl -s http://localhost:3020/feed -H "Authorization: Bearer $JWT"
```

### Option B - Fully standalone (no shared network)
In this mode, containers communicate via host-published ports.  
Use `host.docker.internal` and run without `--network`.

Run services with `weezer-standalone-` prefix:
```bash
docker run -d --name weezer-standalone-database \
  --add-host=host.docker.internal:host-gateway \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=1 \
  -e MYSQL_DATABASE=weezer \
  -e MYSQL_TCP_PORT=3306 \
  -p 3308:3306 \
  weezer-database

docker run -d --name weezer-standalone-localstack \
  --add-host=host.docker.internal:host-gateway \
  -p 4566:4566 \
  localstack/localstack

docker run -d --name weezer-standalone-io \
  --add-host=host.docker.internal:host-gateway \
  -p 3024:3004 \
  weezer-io

docker run -d --name weezer-standalone-backend \
  --add-host=host.docker.internal:host-gateway \
  --env-file .secret \
  -e NODE_CONFIG='{"db":{"host":"host.docker.internal","port":3308},"s3":{"connection":{"endpoint":"http://host.docker.internal:4566"}},"io":{"host":"host.docker.internal","port":3024}}' \
  -p 3030:3000 \
  weezer-backend

docker run -d --name weezer-standalone-frontend \
  --add-host=host.docker.internal:host-gateway \
  -e VITE_REST_SERVER_URL=http://host.docker.internal:3030 \
  -e VITE_IO_SERVER_URL=http://host.docker.internal:3024 \
  -e VITE_GOOGLE_SERVER_URL=http://host.docker.internal:3030/auth/google \
  -e VITE_S3_URL=https://images.weezer.com.s3.amazonaws.com/ \
  -e VITE_STRIPE_PUBLISHABLE_KEY=pk_test_51SgqgYISFdCWx0atQ84SNI5P2uiTrB3c8NvAgtuvhUKd2OlxWPNwaFhnWfYUHnhGIVkyz8paW9utyLxO7PEIlCw400huOeQ85C \
  -p 3014:5173 \
  weezer-frontend
```

Verify end-to-end:
```bash
docker logs --tail=50 weezer-standalone-database
docker logs --tail=50 weezer-standalone-localstack
docker logs --tail=50 weezer-standalone-io
docker logs --tail=50 weezer-standalone-backend
docker logs --tail=50 weezer-standalone-frontend

curl -I http://localhost:3014
curl -s 'http://localhost:3024/socket.io/?EIO=4&transport=polling'
curl -s http://localhost:4566/_localstack/health

JWT=$(curl -s -X POST http://localhost:3030/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"charlie","password":"123456"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("token") or d.get("jwt") or d.get("accessToken") or "")')

curl -s http://localhost:3030/feed -H "Authorization: Bearer $JWT"
```

Cleanup:
```bash
docker rm -f \
  weezer-standalone-frontend \
  weezer-standalone-backend \
  weezer-standalone-io \
  weezer-standalone-localstack \
  weezer-standalone-database
```

## Run Mode 3: Docker Compose (Recommended)
Start:
```bash
docker compose -f docker-compose.yaml up -d
```

Stop:
```bash
docker compose -f docker-compose.yaml down
```

Logs:
```bash
docker compose -f docker-compose.yaml logs -f backend frontend database localstack io
```

Verify end-to-end:
```bash
docker compose -f docker-compose.yaml ps
docker compose -f docker-compose.yaml logs --tail=50 backend
docker compose -f docker-compose.yaml logs --tail=50 frontend
docker compose -f docker-compose.yaml logs --tail=50 database
docker compose -f docker-compose.yaml logs --tail=50 localstack
docker compose -f docker-compose.yaml logs --tail=50 io

curl -I http://localhost:3012
curl -s 'http://localhost:3022/socket.io/?EIO=4&transport=polling'
curl -s http://localhost:4566/_localstack/health

JWT=$(curl -s -X POST http://localhost:3020/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"gustav","password":"123456"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("token") or d.get("jwt") or d.get("accessToken") or "")')

curl -s http://localhost:3020/feed -H "Authorization: Bearer $JWT"
```

## Environment Variables
| Variable | Used By | Description | Example |
|---|---|---|---|
| `NODE_ENV` | backend | Selects backend config profile (`default`, `compose`, `docker`, etc.) | `compose` |
| `NODE_CONFIG` | backend (standalone mode) | Runtime JSON override for host/port endpoints | `{"db":{"host":"host.docker.internal","port":3308}}` |
| `GOOGLE_CLIENT_SECRET` | backend | Google OAuth secret (loaded from `.secret`) | `...` |
| `STORAGE_PROVIDER` | backend | Storage provider override | `s3` |
| `DB_TYPE` | backend | DB engine selector from config | `mysql` |
| `APP_SECRET` | backend | HMAC secret for password hashing | `MySecret` |
| `JWT_SECRET` | backend | JWT signing secret | `JwtSecret` |
| `DB_HOST` | backend | DB hostname override | `database` |
| `AWS_SECRET_ACCESS_KEY` | backend | AWS SDK credential override | `test` |
| `CLOUDINARY_CLOUD_NAME` | backend | Cloudinary configuration | `...` |
| `CLOUDINARY_API_KEY` | backend | Cloudinary configuration | `...` |
| `CLOUDINARY_API_SECRET` | backend | Cloudinary configuration | `...` |
| `STRIPE_SECRET` | backend | Stripe secret key | `...` |
| `WH_SEC` | backend | Stripe webhook secret | `...` |
| `OPENAI_SECRET` | backend | OpenAI API key | `...` |
| `VITE_REST_SERVER_URL` | frontend | Backend REST base URL | `http://backend:3000` |
| `VITE_IO_SERVER_URL` | frontend | Socket.IO server URL | `http://io:3004` |
| `VITE_GOOGLE_SERVER_URL` | frontend | Google auth endpoint URL | `http://backend:3000/auth/google` |
| `VITE_S3_URL` | frontend | Public media base URL | `https://images.weezer.com.s3.amazonaws.com/` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | frontend | Stripe publishable key | `pk_test_...` |

## Ports
| Service | npm mode | docker run mode | compose mode |
|---|---:|---:|---:|
| Frontend | `5173` | Option A: `3013`, Option B: `3014` | `3012` |
| Backend | `3000` | Option A: `3020`, Option B: `3030` | `3020` |
| IO (Socket.IO) | `3004` | Option A: `3022`, Option B: `3024` | `3022` |
| MySQL | `3308` | `3308` | `3309` |
| LocalStack | `4566` | `4566` | `4566` |

## Service Scripts and Dockerfiles
| Service | npm scripts | Dockerfile(s) |
|---|---|---|
| `backend` | `dev`, `build`, `start`, `build:start`, `test` | `backend/Dockerfile` |
| `frontend` | `dev`, `docker`, `build`, `build:compose`, `build:aws`, `build:deploy`, `qa`, `lint`, `preview` | `frontend/Dockerfile`, `frontend/Dockerfile.compose`, `frontend/Dockerfile.aws` |
| `io` | `dev`, `build`, `start`, `test` | `io/Dockerfile` |
| `database` | n/a | `database/Dockerfile` |
| `lib/socket-enums` | `build`, `test` | none |

## Cleanup Commands
npm mode cleanup:
```bash
docker rm -f weezer-run-database weezer-run-localstack
```

docker run Option A cleanup:
```bash
docker rm -f \
  weezer-run-frontend \
  weezer-run-backend \
  weezer-run-io \
  weezer-run-localstack \
  weezer-run-database
docker network rm weezer-net
```

docker run Option B cleanup:
```bash
docker rm -f \
  weezer-standalone-frontend \
  weezer-standalone-backend \
  weezer-standalone-io \
  weezer-standalone-localstack \
  weezer-standalone-database
```
