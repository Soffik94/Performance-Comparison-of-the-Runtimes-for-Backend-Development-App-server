# Endpoint Documentation

All three applications expose the same benchmark API. Each container listens on
port `3000` internally. On the application server, the current host port mapping is:

- Node: `http://<app-server>:3000`
- Deno: `http://<app-server>:3001`
- Bun: `http://<app-server>:3002`

The HTTP contract is intentionally shared across runtimes. Internally, Node.js
uses Express Router, Deno uses Hono on top of `Deno.serve`, and Bun uses native
`Bun.serve` routes.

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

Runs repeated SHA-256 hashing. The `iterations` query parameter is optional.

Query parameters:

- `iterations`: number of hash iterations, default `100000`

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
  "hash": "a1b2c3d4e5f6a7b8"
}
```

### GET /items

Reads all benchmark records from PostgreSQL.

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

Runs repeated SHA-256 hashing. The `iterations` query parameter is optional.

Query parameters:

- `iterations`: number of hash iterations, default `100000`

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
  "hash": "a1b2c3d4e5f6a7b8"
}
```

### GET /items

Reads all benchmark records from PostgreSQL.

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

Runs repeated SHA-256 hashing. The `iterations` query parameter is optional.

Query parameters:

- `iterations`: number of hash iterations, default `100000`

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
  "hash": "a1b2c3d4e5f6a7b8"
}
```

### GET /items

Reads all benchmark records from PostgreSQL.

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
