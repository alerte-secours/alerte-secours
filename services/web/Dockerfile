# syntax = devthefuture/dockerfile-x
FROM ./dockerfile-x/node AS build
ENV NODE_ENV=production
# The yarn cache lives in a buildkit cache mount: it survives layer
# invalidation, so a yarn.lock bump re-downloads only what changed.
ENV YARN_ENABLE_GLOBAL_CACHE=true YARN_GLOBAL_FOLDER=/yarn-global

# fetch
COPY --chown=1000:1000 yarn.lock .yarnrc.yml ./
COPY --chown=1000:1000 .yarn .yarn
RUN --mount=type=cache,target=/yarn-global,uid=1000,gid=1000 yarn fetch workspaces focus @as/web

# copy
COPY --chown=1000:1000 services/web/package.json services/web/package.json
COPY --chown=1000:1000 services/web/src services/web/src
COPY --chown=1000:1000 services/web/public services/web/public

# build
RUN --mount=type=cache,target=/yarn-global,uid=1000,gid=1000 yarn workspaces foreach -A -t run postinstall
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN --mount=type=cache,target=/yarn-global,uid=1000,gid=1000 yarn workspace @as/web build

# server
FROM ./dockerfile-x/nginx
COPY --from=build /app/services/web/build /usr/share/nginx/html/

LABEL project="alertesecours"