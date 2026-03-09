# Fastlane

## Install on laptop

```sh
sudo apt-get install ruby-full
sudo gem install fastlane
```

## Init

```sh
cd android
fastlane init
```

```sh
cd ios
fastlane init
```

### Darling (macOS emulator)

install https://github.com/darlinghq/darling/releases

then run

```sh
darling shell

xcode-select --install
```