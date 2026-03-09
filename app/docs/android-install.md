# Android App Installation Guide

This guide explains how to install the Android app on an emulator or physical device.

## Prerequisites

- Android emulator or physical device connected via ADB
- Java installed (for bundletool)
- ADB installed and configured

## Installation

### Using the Yarn Script

The easiest way to install the app is to use the provided yarn script:

```bash
# Set the device ID (emulator or physical device)
export DEVICE=emulator-5554

# Run the installation script
yarn install:android
```

### Manual Installation

If you need to install the app manually, follow these steps:

1. Navigate to the bundle release directory:
   ```bash
   cd android/app/build/outputs/bundle/release
   ```

2. Build APKs with signing:
   ```bash
   java -jar /opt/bundletool-all-1.17.1.jar build-apks \
     --mode universal \
     --bundle ./app-release.aab \
     --output ./app.apks \
     --ks /home/jo/lab/alerte-secours/as-app/android/app/debug.keystore \
     --ks-pass pass:android \
     --ks-key-alias androiddebugkey \
     --key-pass pass:android
   ```

3. Convert .apks to .zip and extract:
   ```bash
   mv app.apks app.zip
   unzip -o app.zip
   ```

4. Install the APK on the device:
   ```bash
   adb -s $DEVICE install universal.apk
   ```

## Troubleshooting

### Finding Available Devices

To list all available devices:

```bash
adb devices
```

Example output:
```
List of devices attached
emulator-5554   device
```

### Common Issues

1. **No devices found**: Make sure your emulator is running or your physical device is connected and has USB debugging enabled.

2. **Installation fails**: Check if the app is already installed. You might need to uninstall it first:
   ```bash
   adb -s $DEVICE uninstall com.alertesecours
   ```

3. **Signing issues**: If you encounter signing problems, make sure the keystore path is correct and the keystore passwords match.

## Custom Installation Script

A custom installation script (`install-android.sh`) has been created to simplify the installation process. This script:

1. Checks if the DEVICE environment variable is set
2. Navigates to the bundle release directory
3. Builds APKs with signing
4. Converts .apks to .zip and extracts it
5. Installs the APK on the device

You can run this script directly:

```bash
export DEVICE=emulator-5554
./install-android.sh
```

# enable USB debug mode

Add udev rules for your device

1. First, find your device's vendor ID:

```sh
lsusb
```

Look for your phone manufacturer (e.g., Google, Samsung, OnePlus). Note the ID like 18d1:4ee7

2. Create/edit the udev rules file:

```sh
sudo micro /etc/udev/rules.d/51-android.rules
```

3. Add a line for your device. Here are common manufacturers:

```
# Google
SUBSYSTEM=="usb", ATTR{idVendor}=="18d1", MODE="0666", GROUP="plugdev"
# Samsung
SUBSYSTEM=="usb", ATTR{idVendor}=="04e8", MODE="0666", GROUP="plugdev"
# OnePlus
SUBSYSTEM=="usb", ATTR{idVendor}=="2a70", MODE="0666", GROUP="plugdev"
# Xiaomi
SUBSYSTEM=="usb", ATTR{idVendor}=="2717", MODE="0666", GROUP="plugdev"
```

4. Set proper permissions and reload rules:

```sh
sudo chmod a+r /etc/udev/rules.d/51-android.rules
sudo udevadm control --reload-rules
sudo service udev restart
```

5. Add yourself to the plugdev group:

```sh
sudo usermod -aG plugdev $USER
```

Force the authorization prompt

1. Kill adb server:

```sh
adb kill-server
```

2. Unplug your device
3. On your phone:
  - Go to Developer options
  - Revoke USB debugging authorizations
  - Toggle USB debugging OFF then ON

4. Plug the device back in
5. Start adb with proper permissions:

```sh
adb start-server
adb devices
```

6. The authorization prompt should now appear on your phone