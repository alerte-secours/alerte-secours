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

const crypto = require("crypto");
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
const androidManifestPath = path.join(projectRoot, "android/app/src/main/AndroidManifest.xml");

function parseCertificate(pem, origin) {
  let certificate;
  try {
    certificate = new crypto.X509Certificate(pem);
  } catch (error) {
    throw new Error(`${origin} is not a valid X.509 certificate (${error.message})`);
  }
  if (new Date(certificate.validTo) < new Date()) {
    throw new Error(`${origin} expired on ${certificate.validTo}`);
  }
  return certificate;
}

function unescapeXml(value) {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

// The Android manifest is versioned and embeds the same certificate: use it as the
// reference so iOS cannot ship trusting a different one. Returns null only when the
// manifest declares no code signing certificate at all; a declaration that cannot be
// read is an error, so the comparison is never skipped by accident.
function androidCertificate() {
  if (!fs.existsSync(androidManifestPath)) return null;
  const manifest = fs.readFileSync(androidManifestPath, "utf8");
  const name = "expo.modules.updates.CODE_SIGNING_CERTIFICATE";
  if (!manifest.includes(name)) return null;
  const tag = (manifest.match(/<meta-data\b[^>]*>/g) || []).find((element) =>
    element.includes(`"${name}"`),
  );
  const value = tag && tag.match(/android:value="([^"]*)"/);
  if (!value) {
    throw new Error(`cannot read ${name} from the Android manifest`);
  }
  return parseCertificate(unescapeXml(value[1]), "The Android manifest certificate");
}

// A blank or wrong certificate would still build, and the app would then reject every
// signed OTA update without any error at launch. Fail the build instead.
function checkCodeSigningCertificate(expoPlist) {
  const pem = expoPlist.EXUpdatesCodeSigningCertificate;
  if (typeof pem !== "string" || pem.trim() === "") {
    throw new Error(
      "updates.codeSigningCertificate is empty: keys/certificate.pem is missing or blank",
    );
  }
  if ((pem.match(/-----BEGIN CERTIFICATE-----/g) || []).length !== 1) {
    throw new Error("keys/certificate.pem must contain exactly one certificate");
  }
  const certificate = parseCertificate(pem, "keys/certificate.pem");
  const reference = androidCertificate();
  if (reference && reference.fingerprint256 !== certificate.fingerprint256) {
    throw new Error(
      "keys/certificate.pem differs from the code signing certificate of the Android manifest",
    );
  }
  return certificate;
}

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

  const signed = Boolean(exp.updates && exp.updates.codeSigningCertificate);
  const certificate = signed ? checkCodeSigningCertificate(next) : null;
  if (certificate) {
    // Embed the canonical PEM rather than the file as typed. OpenSSL, used for the
    // check above, tolerates stray whitespace or a byte order mark that the strict
    // decoder of expo-updates on iOS rejects.
    next.EXUpdatesCodeSigningCertificate = certificate.toString();
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, plist.build(next));

  console.log(
    `[ios-generate-expo-plist] ${path.relative(projectRoot, target)}: runtime ${next.EXUpdatesRuntimeVersion}, updates ${next.EXUpdatesEnabled ? "enabled" : "disabled"}` +
      (certificate ? `, certificate sha256 …${certificate.fingerprint256.slice(-17)}` : ""),
  );
}

main().catch((error) => {
  console.error(`[ios-generate-expo-plist] ${error.message}`);
  process.exit(1);
});
