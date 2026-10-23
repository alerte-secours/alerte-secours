# syntax = devthefuture/dockerfile-x

FROM ./downloader.dockerfile AS build-node

# renovate: datasource=node depName=node versioning=node
ARG NODE_VERSION=24.22.1

ARG NODE_PACKAGE=node-v$NODE_VERSION-linux-x64

RUN curl https://nodejs.org/dist/v$NODE_VERSION/$NODE_PACKAGE.tar.gz \
  | tar -xzC /opt/ \
  && mv /opt/$NODE_PACKAGE /opt/node


FROM ./ubuntu.dockerfile

COPY --from=build-node /opt/node /opt/node
ENV NODE_PATH /opt/node/lib/node_modules
ENV PATH /opt/node/bin:$PATH

RUN npm i -g yarn

WORKDIR /app
USER 1000

# enable yarn immutable dependencies
ENV CI=true