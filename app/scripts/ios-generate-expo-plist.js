#!/usr/bin/env node
// Generates ios/AlerteSecours/Supporting/Expo.plist from app.config.js, using the same
// code path as `expo prebuild`.
//
// The file is git-ignored, so it used to be copied by hand between machines and could
// drift from the versioned configuration (a stale runtime version makes the app fetch
// OTA updates built for older native code). Generating it keeps the expo-updates
// settings (runtime version, URL, code signing certificate) tied to app.config.js.
//
// Usage: node scripts/ios-generate-expo-plist.js [output-path]

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const expoDir = path.dirname(require.resolve("expo/package.json", { paths: [projectRoot] }));
const fromExpo = (id) => require(require.resolve(id, { paths: [expoDir] }));

const { getConfig } = fromExpo("@expo/config");
const { IOSConfig } = fromExpo("@expo/config-plugins");
const plist = fromExpo("@expo/plist").default;

const target = path.resolve(
  process.argv[2] || path.join(projectRoot, "ios/AlerteSecours/Supporting/Expo.plist"),
);

async function main() {
  const { exp } = getConfig(projectRoot, { skipSDKVersionRequirement: true });
  const expoUpdatesVersion = require(
    require.resolve("expo-updates/package.json", { paths: [projectRoot] }),
  ).version;

  const next = await IOSConfig.Updates.setUpdatesConfigAsync(
    projectRoot,
    exp,
    {},
    expoUpdatesVersion,
  );

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, plist.build(next));

  console.log(
    `[ios-generate-expo-plist] ${path.relative(projectRoot, target)}: runtime ${next.EXUpdatesRuntimeVersion}, updates ${next.EXUpdatesEnabled ? "enabled" : "disabled"}`,
  );
}

main().catch((error) => {
  console.error(`[ios-generate-expo-plist] ${error.message}`);
  process.exit(1);
});
