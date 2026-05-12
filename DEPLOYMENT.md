# Deployment

This repository contains three benchmark applications with the same HTTP API:
Node.js, Deno, and Bun. The applications run on the application server and use
PostgreSQL on a separate database server. Performance tests are started from the
measurement server.

The applications use comparable routing layers for the shared API surface:
Node.js uses Express Router, Deno uses `Deno.serve` with a custom lightweight
route table, and Bun uses native `Bun.serve` routes. Deno and Bun do not use an
external HTTP framework for benchmarked endpoints.

## Server Topology

| Role | Hostname | Public IP | Private IP | Purpose |
| --- | --- | --- | --- | --- |
| Database server | `db` | `138.199.161.252` | `10.0.0.2` | PostgreSQL, PostgreSQL exporter, host metrics |
| Measurement server | `merici` | `178.105.65.16` | `10.0.0.3` | Grafana, Prometheus, k6 scripts, host metrics |
| Application server | `app` | `178.105.79.83` | `10.0.0.4` | Node.js, Deno, Bun benchmark apps, host metrics |

The benchmark traffic should use the private network addresses. k6 therefore
targets `10.0.0.4`, and all applications connect to PostgreSQL at `10.0.0.2`.

## Current Containers

### Database Server

| Container | Image | Port mapping | Purpose |
| --- | --- | --- | --- |
| `postgres-db` | `postgres` | `0.0.0.0:5432->5432/tcp` | benchmark database |
| `postgres-exporter` | `prometheuscommunity/postgres-exporter` | `0.0.0.0:9187->9187/tcp` | PostgreSQL metrics for Prometheus |
| `node-exporter` | `quay.io/prometheus/node-exporter:latest` | host/network dependent | database server metrics |

### Measurement Server

| Container | Image | Port mapping | Purpose |
| --- | --- | --- | --- |
| `grafana` | `grafana/grafana` | `0.0.0.0:3000->3000/tcp` | Grafana dashboards |
| `prometheus` | `prom/prometheus` | `0.0.0.0:9090->9090/tcp` | metrics storage and k6 remote-write receiver |
| `node-exporter` | `prom/node-exporter` | `0.0.0.0:9100->9100/tcp` | measurement server metrics |

### Application Server

| Container | Image | Port mapping | Purpose |
| --- | --- | --- | --- |
| `node-app-container` | `node-app-image` | `0.0.0.0:3000->3000/tcp` | Node.js benchmark API |
| `deno-app-container` | `deno-app-image` | `0.0.0.0:3001->3000/tcp` | Deno benchmark API |
| `bun-app-container` | `bun-app-image` | `0.0.0.0:3002->3000/tcp` | Bun benchmark API |
| `node-exporter` | `quay.io/prometheus/node-exporter:latest` | host/network dependent | application server metrics |

If `docker ps` does not show `0.0.0.0:9100->9100/tcp` for a node-exporter
container, verify that it is running in host network mode. Prometheus must be
able to reach `10.0.0.2:9100`, `10.0.0.3:9100`, and `10.0.0.4:9100` if host
metrics are required.

## Database

For clean benchmark isolation, each runtime uses its own PostgreSQL schema:

| Runtime | Schema | Table |
| --- | --- | --- |
| Node.js | `node_schema` | `users` |
| Deno | `deno_schema` | `users` |
| Bun | `bun_schema` | `users` |

Run this once on the database server:

```bash
psql -h 10.0.0.2 -p 5432 -U admin -d mydb -f db/runtime-schemas.sql
```

The application `.env` files must point to the database server:

```env
DB_HOST=10.0.0.2
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=<real-password>
DB_NAME=mydb
DB_POOL_MAX=30
```

Use these schema values:

| App | `DB_SCHEMA` |
| --- | --- |
| Node.js | `node_schema` |
| Deno | `deno_schema` |
| Bun | `bun_schema` |

## Application Ports

Each application listens on port `3000` inside its container. The application
server exposes them on separate host ports:

| Runtime | Public base URL | Private base URL | Host port | Container port |
| --- | --- | --- | --- | --- |
| Node.js | `http://178.105.79.83:3000` | `http://10.0.0.4:3000` | `3000` | `3000` |
| Deno | `http://178.105.79.83:3001` | `http://10.0.0.4:3001` | `3001` | `3000` |
| Bun | `http://178.105.79.83:3002` | `http://10.0.0.4:3002` | `3002` | `3000` |

## Build And Run

From the repository root on the application server:

```bash
cd Node-app
cp .env.example .env
docker build -t node-app-image .
docker rm -f node-app-container || true
docker run -d --name node-app-container --env-file .env -p 3000:3000 node-app-image

cd ../Deno-app
cp .env.example .env
docker build -t deno-app-image .
docker rm -f deno-app-container || true
docker run -d --name deno-app-container --env-file .env -p 3001:3000 deno-app-image

cd ../Bun-app
cp .env.example .env
docker build -t bun-app-image .
docker rm -f bun-app-container || true
docker run -d --name bun-app-container --env-file .env -p 3002:3000 bun-app-image
```

The Deno image caches modules during `docker build` with `deno cache server.js`.
The HTTP routing layer is local project code, not an external framework.

## Smoke Tests

Run these on the application server or from the measurement server. Prefer the
private IP address when testing from another server.

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
- `/compute?iterations=10` returns status `200` and `iterations: 10`.
- `POST /items` returns status `201`.
- `GET /items` returns a JSON array with at most one newest row.

## Reset Between Runs

For comparable database read/write tests, reset or normalize the tables between
benchmark runs:

```sql
TRUNCATE node_schema.users RESTART IDENTITY;
TRUNCATE deno_schema.users RESTART IDENTITY;
TRUNCATE bun_schema.users RESTART IDENTITY;
```

For read benchmarks, seed all three schemas with comparable data volumes before
starting k6. The read endpoint intentionally returns only the newest row so the
test measures PostgreSQL communication and driver overhead instead of large JSON
serialization and response transfer.
