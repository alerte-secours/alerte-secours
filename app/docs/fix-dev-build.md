- clear yarn
```sh
rm -rf node_modules
yarn
```

- clean gradle
```sh
cd android
./gradlew clean
```

- clear gradle cache
```sh
rm -rf ~/.gradle/caches/
rm -rf android/.gradle/
```

- stop gradle daemons
```sh
cd android && ./gradlew --stop
```

- clear abd cache (useful when not receiving notification on emulator)
```sh
adb shell pm clear com.alertesecours
```

- rebuild gradle
```sh
yarn expo run:android
```

- rebuild expo react-native
```sh
yarn expo prebuild
```

- clear metro cache
```sh
yarn expo start --dev-client --clear
```

- fix emulator (eg: unavailable FCM getToken)
  - clear cache / uninstall the app
  - check emulator datetime
  - check network connectivity

- https://github.com/expo/expo/issues/22029#issuecomment-2239751213

android/local.properties
```ini
cmake.dir=/opt/Android/Sdk/cmake/3.22.1
```