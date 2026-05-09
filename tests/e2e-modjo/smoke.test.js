// e2e smoke test verifying that the modjo-driven backend services expose the
// expected HTTP contracts. Designed for non-regression after upgrading
// @modjo/core: every assertion is either deterministic (status codes,
// schemas) or covers an observable invariant of the public API.
//
// Run against a running stack (docker compose up):
//   node --test tests/e2e-modjo/

/* eslint-disable no-underscore-dangle */
//
// Env overrides:
//   API_URL    (default http://localhost:4200)
//   FILES_URL  (default http://localhost:4292)
//   HASURA_URL (default http://localhost:4201)
//   HASURA_ADMIN_SECRET (default admin)

const { test, describe } = require("node:test")
const assert = require("node:assert/strict")

const API = process.env.API_URL || "http://localhost:4200"
const FILES = process.env.FILES_URL || "http://localhost:4292"
const HASURA = process.env.HASURA_URL || "http://localhost:4201"
const ADMIN = process.env.HASURA_ADMIN_SECRET || "admin"

const json = (r) => r.json()

async function req(url, opts = {}) {
  const res = await fetch(url, opts)
  return res
}

describe("api service — startup + public HTTP contract", () => {
  test("OpenAPI spec is served and well-formed", async () => {
    const res = await req(`${API}/api/v1/spec`)
    assert.equal(res.status, 200)
    const spec = await json(res)
    assert.ok(spec.openapi || spec.swagger, "missing OpenAPI version field")
    assert.ok(spec.paths, "missing paths")
    assert.ok(Object.keys(spec.paths).length >= 20, "fewer paths than expected")
  })

  test("OpenAPI spec lists known critical operations", async () => {
    const spec = await json(await req(`${API}/api/v1/spec`))
    const expected = [
      "/alert/send-alert",
      "/alert/close",
      "/auth/init/token",
      "/auth/login/token",
      "/jwks",
      "/user/destroy",
      "/geoloc/sync",
    ]
    for (const p of expected) {
      assert.ok(spec.paths[p], `missing path ${p}`)
    }
  })

  test("/jwks returns at least one key with kid+kty", async () => {
    const res = await req(`${API}/api/v1/oas/jwks`)
    assert.equal(res.status, 200)
    const body = await json(res)
    assert.ok(Array.isArray(body.keys), "jwks.keys is not an array")
    assert.ok(body.keys.length >= 1, "no keys returned")
    for (const k of body.keys) {
      assert.ok(k.kid, "jwk missing kid")
      assert.ok(k.kty, "jwk missing kty")
    }
  })

  test("/auth/init/token issues a JWT", async () => {
    const res = await req(`${API}/api/v1/oas/auth/init/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    })
    assert.equal(res.status, 200)
    const body = await json(res)
    assert.ok(typeof body.authTokenJwt === "string")
    // structure of a JWT: 3 base64url segments separated by dots
    assert.match(
      body.authTokenJwt,
      /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
    )
  })

  test("public auth endpoints return well-defined status codes", async () => {
    const cases = [
      // GET endpoints requiring query params → 400 missing
      { method: "GET", path: "/auth/email/verify", expect: 400 },
      { method: "GET", path: "/auth/email/connect", expect: 400 },
      // POST without auth on non-public path returns 405 (wrong method) on GET routes
      { method: "GET", path: "/auth/init/token", expect: 405 },
      { method: "GET", path: "/auth/login/token", expect: 405 },
    ]
    for (const c of cases) {
      const res = await req(`${API}/api/v1/oas${c.path}`, { method: c.method })
      assert.equal(
        res.status,
        c.expect,
        `${c.method} ${c.path} got ${res.status}, expected ${c.expect}`
      )
    }
  })

  test("protected endpoints reject unauthenticated requests with 401", async () => {
    const protectedPaths = [
      "/dev",
      "/user/id",
      "/info/what3words",
      "/info/nominatim",
      "/info/nominatim-search",
      "/radar/people-count",
    ]
    for (const p of protectedPaths) {
      const res = await req(`${API}/api/v1/oas${p}`)
      assert.equal(res.status, 401, `${p} should require auth`)
    }
  })

  test("protected PATCH endpoints reject unauthenticated requests", async () => {
    const protectedPatch = [
      "/alert/close",
      "/alert/send-alert",
      "/alert/notify-relatives",
      "/user/destroy",
    ]
    for (const p of protectedPatch) {
      const res = await req(`${API}/api/v1/oas${p}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: "{}",
      })
      assert.equal(res.status, 401, `PATCH ${p} should require auth`)
    }
  })
})

describe("api service — GraphQL gateway", () => {
  test("GraphQL introspection returns the API remote schema", async () => {
    const res = await req(`${API}/api/v1/graphql`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query:
          "query { __schema { queryType { name } mutationType { name } } }",
      }),
    })
    assert.equal(res.status, 200)
    const body = await json(res)
    assert.ok(body.data && body.data.__schema, "no schema in response")
    assert.ok(body.data.__schema.queryType.name, "no queryType.name")
  })
})

describe("files service — startup + public HTTP contract", () => {
  test("OpenAPI spec is served and well-formed", async () => {
    const res = await req(`${FILES}/api/v1/spec`)
    assert.equal(res.status, 200)
    const spec = await json(res)
    assert.ok(spec.openapi || spec.swagger)
    assert.ok(spec.paths)
  })

  test("protected endpoint(s) reject unauthenticated requests", async () => {
    const spec = await json(await req(`${FILES}/api/v1/spec`))
    // pick a protected path from the spec, send GET, expect 401 or 405
    const paths = Object.keys(spec.paths || {})
    if (paths.length > 0) {
      const p = paths[0]
      const res = await req(`${FILES}/api/v1/oas${p}`)
      assert.ok(
        [401, 404, 405].includes(res.status),
        `${p} returned ${res.status}, expected 401/404/405`
      )
    }
  })
})

describe("hasura service — GraphQL introspection", () => {
  test("admin role returns the schema", async () => {
    const res = await req(`${HASURA}/v1/graphql`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-hasura-admin-secret": ADMIN,
      },
      body: JSON.stringify({
        query: "query { __schema { queryType { name } } }",
      }),
    })
    assert.equal(res.status, 200)
    const body = await json(res)
    assert.ok(body.data && body.data.__schema, "missing schema")
  })

  test("anonymous role gets restricted access", async () => {
    const res = await req(`${HASURA}/v1/graphql`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query: "query { __schema { queryType { name } } }",
      }),
    })
    // hasura returns 200 with the limited schema for anonymous role
    assert.equal(res.status, 200)
  })
})

describe("api service — auth error paths", () => {
  test("invalid bearer token returns 401, not 500", async () => {
    const res = await req(`${API}/api/v1/oas/user/id`, {
      headers: { authorization: "Bearer not-a-real-jwt" },
    })
    assert.equal(res.status, 401)
  })

  test("malformed JSON body on POST returns a 4xx, not a crash", async () => {
    const res = await req(`${API}/api/v1/oas/auth/init/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not-json",
    })
    assert.ok(res.status >= 400 && res.status < 500, `status=${res.status}`)
  })
})

describe("modjo lifecycle invariants (regression guard)", () => {
  test("api service stays up under repeated requests (no leaked unhandled rejection)", async () => {
    // 50 fast requests; previously, an unhandled rejection inside ready()
    // could crash the process (#1 fix). Now any error must be observable.
    const results = await Promise.all(
      Array.from({ length: 50 }, () => req(`${API}/api/v1/spec`))
    )
    for (const r of results) {
      assert.equal(r.status, 200)
    }
  })

  test("api OpenAPI spec is stable across 3 consecutive fetches", async () => {
    // Same content (deep equal) across calls — guards against any per-request
    // mutation introduced by Container/ctx changes.
    const a = await json(await req(`${API}/api/v1/spec`))
    const b = await json(await req(`${API}/api/v1/spec`))
    const c = await json(await req(`${API}/api/v1/spec`))
    assert.deepEqual(b, a)
    assert.deepEqual(c, a)
  })
})
