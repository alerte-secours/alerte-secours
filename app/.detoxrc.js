const { version } = require("./package.json");

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: "jest",
      config: "e2e/jest.config.js",
    },
    jest: {
      setupTimeout: 300000,
    },
  },
  apps: {
    "ios.debug": {
      type: "ios.app",
      // Debug simulator build (expo-dev-client): the bundle is served by
      // Metro (`yarn start:staging`). No build command here yet: build the
      // AlerteSecours scheme for the simulator with Xcode 26 and point
      // E2E_IOS_APP_PATH at the resulting AlerteSecours.app. Keep the build
      // products outside ios/, where `pod install` chokes on their
      // Info.plist files.
      binaryPath:
        process.env.E2E_IOS_APP_PATH ||
        "build/ios-e2e/Build/Products/Debug-iphonesimulator/AlerteSecours.app",
    },
    "android.debug": {
      type: "android.apk",
      // ABI flavor emulatorX86_64 + custom output naming (see android/app/build.gradle)
      binaryPath: `android/app/build/outputs/apk/emulatorX86_64/debug/alertesecours-${version}-debug.apk`,
      testBinaryPath:
        "android/app/build/outputs/apk/androidTest/emulatorX86_64/debug/app-emulatorX86_64-debug-androidTest.apk",
      build:
        "cd android && ENVFILE=../.env.staging ./gradlew assembleEmulatorX86_64Debug assembleEmulatorX86_64DebugAndroidTest -DtestBuildType=debug -PreactNativeArchitectures=x86_64",
      reversePorts: [8081],
    },
    "android.release": {
      type: "android.apk",
      binaryPath: `android/app/build/outputs/apk/emulatorX86_64/release/alertesecours-${version}-release.apk`,
      testBinaryPath:
        "android/app/build/outputs/apk/androidTest/emulatorX86_64/release/app-emulatorX86_64-release-androidTest.apk",
      build:
        "cd android && ENVFILE=../.env.staging ./gradlew assembleEmulatorX86_64Release assembleEmulatorX86_64ReleaseAndroidTest -DtestBuildType=release -PreactNativeArchitectures=x86_64 -PdetoxE2E=true",
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        type: process.env.E2E_IOS_DEVICE || "iPhone 17 Pro",
      },
    },
    attached: {
      type: "android.attached",
      device: {
        adbName: ".*", // any attached device
      },
    },
    emulator: {
      type: "android.emulator",
      device: {
        avdName: process.env.ANDROID_EMULATOR_NAME || "Medium_Phone_API_36.0",
      },
    },
  },
  configurations: {
    "ios.sim.debug": {
      device: "simulator",
      app: "ios.debug",
    },
    "android.emu.debug": {
      device: "emulator",
      app: "android.debug",
    },
    "android.emu.release": {
      device: "emulator",
      app: "android.release",
    },
  },
};
