# Endpoint Documentation

All three applications expose the same benchmark API. Each container listens on
port `3000` internally. On the application server, the current host port mapping is:

- Node: `http://<app-server>:3000`
- Deno: `http://<app-server>:3001`
- Bun: `http://<app-server>:3002`

The HTTP contract is intentionally shared across runtimes. Internally, Node.js
uses Express Router, Deno uses `Deno.serve` with a custom lightweight route
table, and Bun uses native `Bun.serve` routes. Deno and Bun have an explicit
routing layer without an external framework.

For H3, `/ping` is the primary scenario because it isolates HTTP stack, routing,
JSON serialization, and framework/runtime overhead. `/compute` is a
supplementary CPU-bound scenario and should be interpreted carefully because it
also measures deterministic JavaScript CPU work.

The `/compute` contract is shared across runtimes: the endpoint accepts
`iterations`, runs the same pure ECMAScript 32-bit integer mixing loop in each
runtime, and returns `message`, `iterations`, `duration_ms`, and `hash`. No
runtime crypto API is used. The `hash` field contains the deterministic
8-character hexadecimal result of the CPU loop.

## Node App

Base URL locally in container: `http://localhost:3000`

### GET /ping

Measures basic HTTP stack throughput.

Response `200`:

```json
{
  "message": "pong"
}
```

### GET /compute

Runs deterministic pure JavaScript CPU work. The `iterations` query parameter
is optional.

Query parameters:

- `iterations`: number of CPU loop iterations, default `100000`

Example:

```http
GET /compute?iterations=100000
```

Response `200`:

```json
{
  "message": "compute done",
  "iterations": 100000,
  "duration_ms": 120,
  "hash": "32bd39d9"
}
```

### GET /items

Reads the newest benchmark record from PostgreSQL. The endpoint returns at most
one row so read benchmarks do not include full-table JSON serialization and
large response transfer.

Response `200`:

```json
[
  {
    "id": 1,
    "name": "Node",
    "email": "node@example.com",
    "created_at": "2026-05-03T08:16:08.455Z"
  }
]
```

### POST /items

Creates one benchmark record in PostgreSQL.

Request body:

```json
{
  "name": "Node",
  "email": "node@example.com"
}
```

Response `201`:

```json
{
  "id": 1,
  "name": "Node",
  "email": "node@example.com",
  "created_at": "2026-05-03T08:16:08.455Z"
}
```

## Deno App

Base URL locally in container: `http://localhost:3000`

### GET /ping

Measures basic HTTP stack throughput.

Response `200`:

```json
{
  "message": "pong"
}
```

### GET /compute

Runs deterministic pure JavaScript CPU work. The `iterations` query parameter
is optional.

Query parameters:

- `iterations`: number of CPU loop iterations, default `100000`

Example:

```http
GET /compute?iterations=100000
```

Response `200`:

```json
{
  "message": "compute done",
  "iterations": 100000,
  "duration_ms": 120,
  "hash": "32bd39d9"
}
```

### GET /items

Reads the newest benchmark record from PostgreSQL. The endpoint returns at most
one row so read benchmarks do not include full-table JSON serialization and
large response transfer.

Response `200`:

```json
[
  {
    "id": 1,
    "name": "Deno",
    "email": "deno@example.com",
    "created_at": "2026-05-03T08:16:08.455Z"
  }
]
```

### POST /items

Creates one benchmark record in PostgreSQL.

Request body:

```json
{
  "name": "Deno",
  "email": "deno@example.com"
}
```

Response `201`:

```json
{
  "id": 1,
  "name": "Deno",
  "email": "deno@example.com",
  "created_at": "2026-05-03T08:16:08.455Z"
}
```

## Bun App

Base URL locally in container: `http://localhost:3000`

### GET /ping

Measures basic HTTP stack throughput.

Response `200`:

```json
{
  "message": "pong"
}
```

### GET /compute

Runs deterministic pure JavaScript CPU work. The `iterations` query parameter
is optional.

Query parameters:

- `iterations`: number of CPU loop iterations, default `100000`

Example:

```http
GET /compute?iterations=100000
```

Response `200`:

```json
{
  "message": "compute done",
  "iterations": 100000,
  "duration_ms": 120,
  "hash": "32bd39d9"
}
```

### GET /items

Reads the newest benchmark record from PostgreSQL. The endpoint returns at most
one row so read benchmarks do not include full-table JSON serialization and
large response transfer.

Response `200`:

```json
[
  {
    "id": 1,
    "name": "Bun",
    "email": "bun@example.com",
    "created_at": "2026-05-03T08:16:08.455Z"
  }
]
```

### POST /items

Creates one benchmark record in PostgreSQL.

Request body:

```json
{
  "name": "Bun",
  "email": "bun@example.com"
}
```

Response `201`:

```json
{
  "id": 1,
  "name": "Bun",
  "email": "bun@example.com",
  "created_at": "2026-05-03T08:16:08.455Z"
}
```

## Shared Error Responses

All applications use the same error response format.

### 400 Bad Request

Invalid JSON:

```json
{
  "error": "invalid json"
}
```

Missing required `name` or `email` field:

```json
{
  "error": "name and email required"
}
```

### 404 Not Found

```json
{
  "error": "not found"
}
```

### 405 Method Not Allowed

```json
{
  "error": "method not allowed"
}
```

### 500 Internal Server Error

```json
{
  "error": "internal error"
}
```
