# syntax = devthefuture/dockerfile-x

FROM ./dockerfile-x/node AS build
ENV NODE_ENV=production
# The yarn cache lives in a buildkit cache mount: it survives layer
# invalidation, so a yarn.lock bump re-downloads only what changed.
ENV YARN_ENABLE_GLOBAL_CACHE=true YARN_GLOBAL_FOLDER=/yarn-global

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

LABEL project="alertesecours"