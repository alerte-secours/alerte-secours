# e2e-modjo — backend contract tests

Fast black-box tests that verify the modjo-driven backend services (api,
files, tasks, watchers, hasura) expose the expected HTTP/GraphQL contracts.

These tests are designed to run after a stack upgrade — in particular when
upgrading `@modjo/core` — to catch regressions on:

- service startup (must reach `ready` and serve traffic)
- OpenAPI specs (paths still present, schema still valid)
- public endpoints (status codes match expectations)
- protected endpoints (still reject anonymous requests with 401)
- GraphQL introspection (api remote schema + hasura admin schema)
- runtime invariants (no leaked unhandled rejections, deterministic specs)

## Run

```sh
# Local docker-compose (default):
docker compose up -d
cd tests/e2e-modjo && ./run.sh

# Staging / prod — pass URLs via env:
API_URL=https://api.example.com \
  FILES_URL=https://files.example.com \
  HASURA_URL=https://hasura.example.com \
  ./run.sh staging
```

`run.sh` does a quick reachability check on `API_URL` before starting and
exits with a clear error if the target is down.

## Envs

| Variable             | Default                | Notes                       |
| -------------------- | ---------------------- | --------------------------- |
| `API_URL`            | `http://localhost:4200`| api service                 |
| `FILES_URL`          | `http://localhost:4292`| files service               |
| `HASURA_URL`         | `http://localhost:4201`| hasura service              |
| `HASURA_ADMIN_SECRET`| `admin`                | hasura admin secret         |

## Why a separate suite

The existing `tests/e2e/` suite uses jest snapshot tests that require manual
re-baselining whenever the GraphQL schema or OpenAPI spec evolves (which
happens often). This `e2e-modjo` suite asserts only **stable invariants**
that should hold regardless of schema changes — making it suitable as a
regression gate after framework upgrades.
