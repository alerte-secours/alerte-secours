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
# bring the stack up first
docker compose up -d
# (optional: also start with the modjo override if testing a dev modjo core)
# docker compose -f docker-compose.yaml -f docker-compose.modjo-smoke.yaml up -d

# run tests against the running stack
cd tests/e2e-modjo
node --test --test-reporter=spec .
```

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
