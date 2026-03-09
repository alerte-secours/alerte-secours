# AAB to APK

install bundletool

```sh
# brew install bundletool
```

or download from https://github.com/google/bundletool/releases
```
alias bundletool='java -jar /opt/bundletool-all-1.17.1.jar'
```

```sh
cd android/app/build/outputs/bundle/release
```

```sh
bundletool build-apks --mode universal --bundle ./app-release.aab --output ./app.apks
mv app.apks app.zip
unzip -o app.zip
```

# ADB

restart adb
```sh
adb kill-server && adb start-server
```

list devices
```sh
adb devices
```


# Android
 
 enable usb debug mode in developer options


# Install

```sh
adb install universal.apk
```

# Shortcut scripts
