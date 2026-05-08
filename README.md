# Backend Runtime Benchmark Applications

This repository contains three equivalent backend applications used for
performance comparison of Node.js, Deno, and Bun. Each application exposes the
same benchmark API and connects to PostgreSQL through a runtime-specific schema.

The applications are intended to run on the application server, while load tests
are executed from a separate measurement server using Grafana k6.

## Repository Structure

| Path | Description |
| --- | --- |
| `Node-app/` | Node.js + Express implementation |
| `Deno-app/` | Deno native HTTP server with Hono routing |
| `Bun-app/` | Bun native HTTP server with `Bun.serve` routes |
| `db/runtime-schemas.sql` | PostgreSQL schemas and tables for benchmark isolation |
| `DEPLOYMENT.md` | server topology, Docker deployment, smoke tests |
| `ENDPOINTS.md` | detailed API documentation |

## Runtime Architecture

All three applications expose the same API surface:

| Endpoint | Method | Benchmark purpose |
| --- | --- | --- |
| `/ping` | `GET` | basic HTTP request-response latency |
| `/compute?iterations=...` | `GET` | CPU-bound SHA-256 hashing |
| `/items` | `GET` | PostgreSQL read workload |
| `/items` | `POST` | PostgreSQL write workload |

The routing layer is runtime-specific while keeping the endpoint behavior
equivalent: Node.js uses Express Router, Deno uses the lightweight Hono router
(`jsr:@hono/hono@4.12.18`) on top of `Deno.serve`, and Bun uses native
`Bun.serve` routes.

Each container listens on port `3000` internally. On the application server, the
runtimes are exposed on separate host ports:

| Runtime | Private base URL | Host port | Container port |
| --- | --- | --- | --- |
| Node.js | `http://10.0.0.4:3000` | `3000` | `3000` |
| Deno | `http://10.0.0.4:3001` | `3001` | `3000` |
| Bun | `http://10.0.0.4:3002` | `3002` | `3000` |

## Infrastructure

| Role | Hostname | Public IP | Private IP |
| --- | --- | --- | --- |
| Database server | `db` | `138.199.161.252` | `10.0.0.2` |
| Measurement server | `merici` | `178.105.65.16` | `10.0.0.3` |
| Application server | `app` | `178.105.79.83` | `10.0.0.4` |

Benchmark traffic and database traffic should use the private network.

## Database Isolation

Each runtime writes to its own PostgreSQL schema:

| Runtime | Schema | Table |
| --- | --- | --- |
| Node.js | `node_schema` | `users` |
| Deno | `deno_schema` | `users` |
| Bun | `bun_schema` | `users` |

Initialize the schemas on the database server:

```bash
psql -h 10.0.0.2 -p 5432 -U admin -d mydb -f db/runtime-schemas.sql
```

## Environment

Each application has its own `.env.example`. Copy it to `.env` inside the
application directory and fill in the real database password.

Required variables:

```env
PORT=3000
DB_HOST=10.0.0.2
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=<real-password>
DB_NAME=mydb
DB_SCHEMA=<runtime-schema>
DB_POOL_MAX=30
```

Use `node_schema`, `deno_schema`, or `bun_schema` for `DB_SCHEMA` depending on
the application.

## Build And Run

Run from the repository root on the application server:

```bash
cd Node-app
docker build -t node-app-image .
docker rm -f node-app-container || true
docker run -d --name node-app-container --env-file .env -p 3000:3000 node-app-image

cd ../Deno-app
docker build -t deno-app-image .
docker rm -f deno-app-container || true
docker run -d --name deno-app-container --env-file .env -p 3001:3000 deno-app-image

cd ../Bun-app
docker build -t bun-app-image .
docker rm -f bun-app-container || true
docker run -d --name bun-app-container --env-file .env -p 3002:3000 bun-app-image
```

## Smoke Tests

```bash
curl http://10.0.0.4:3000/ping
curl http://10.0.0.4:3001/ping
curl http://10.0.0.4:3002/ping

curl "http://10.0.0.4:3000/compute?iterations=10"
curl "http://10.0.0.4:3001/compute?iterations=10"
curl "http://10.0.0.4:3002/compute?iterations=10"

curl -X POST http://10.0.0.4:3000/items -H "Content-Type: application/json" -d '{"name":"Node","email":"node@example.com"}'
curl -X POST http://10.0.0.4:3001/items -H "Content-Type: application/json" -d '{"name":"Deno","email":"deno@example.com"}'
curl -X POST http://10.0.0.4:3002/items -H "Content-Type: application/json" -d '{"name":"Bun","email":"bun@example.com"}'

curl http://10.0.0.4:3000/items
curl http://10.0.0.4:3001/items
curl http://10.0.0.4:3002/items
```

Expected results:

- `/ping` returns `{"message":"pong"}`.
- `/compute` returns status `200` and a JSON payload with `iterations`,
  `duration_ms`, and `hash`.
- `POST /items` returns status `201`.
- `GET /items` returns a JSON array.

## Benchmarking

Load tests are stored in the separate measurement repository on the `merici`
server. The tests are implemented with Grafana k6 and export results to
Prometheus remote write for Grafana visualization.

See the measurement repository documentation for test execution details.

## Further Documentation

- `DEPLOYMENT.md` contains server topology, Docker deployment, database setup,
  and operational checks.
- `ENDPOINTS.md` contains detailed API request and response documentation.
