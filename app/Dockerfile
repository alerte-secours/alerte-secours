FROM reactnativecommunity/react-native-android:9

RUN groupadd -g 1000 ubuntu && useradd -rm -d /home/ubuntu -s /bin/bash -g ubuntu -G sudo -u 1000 ubuntu

USER 1000
WORKDIR /workspace

ENV HUSKY=0

COPY --chown=1000:1000 yarn.lock .yarnrc.yml ./
COPY --chown=1000:1000 .yarn .yarn
RUN yarn fetch --immutable
COPY --chown=1000:1000 . .
RUN yarn postinstall

RUN yarn expo prebuild

RUN cd android && \
  ./gradlew assemble

ENV APP_PORT=19000
CMD ["/bin/sh", "-c", "adb wait-for-device && yarn run android --port ${APP_PORT} && yarn start --port ${APP_PORT}"]