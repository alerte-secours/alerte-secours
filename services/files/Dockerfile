# syntax = devthefuture/dockerfile-x

FROM ./dockerfile-x/node AS build
ENV NODE_ENV=production
# The yarn cache lives in a buildkit cache mount: it survives layer
# invalidation, so a yarn.lock bump re-downloads only what changed.
ENV YARN_ENABLE_GLOBAL_CACHE=true YARN_GLOBAL_FOLDER=/yarn-global

# Install build dependencies for native modules (@sentry/profiling-node)
USER root
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
USER 1000

# fetch
COPY --chown=1000:1000 yarn.lock .yarnrc.yml ./
COPY --chown=1000:1000 .yarn .yarn
RUN --mount=type=cache,target=/yarn-global,uid=1000,gid=1000 yarn fetch workspaces focus @as/files

# copy
COPY --chown=1000:1000 libs libs
COPY --chown=1000:1000 services/files/package.json services/files/package.json
COPY --chown=1000:1000 services/files/src services/files/src

# build
RUN --mount=type=cache,target=/yarn-global,uid=1000,gid=1000 yarn workspaces foreach -A -t run postinstall
RUN --mount=type=cache,target=/yarn-global,uid=1000,gid=1000 yarn workspace @as/files build

FROM ./dockerfile-x/node
ENV NODE_ENV=production
CMD ["node","/app/dist/index.js","start"]
COPY --from=build /app/services/files/dist/ /app/dist/
# @sentry/profiling-node 8.x ships no binding for the node 24 ABI; the
# bundle resolves it from the app root, so ship the one built from source.
COPY --from=build /app/node_modules/@sentry/profiling-node/lib/sentry_cpu_profiler-linux-x64-glibc-137.node /app/

LABEL project="alertesecours"