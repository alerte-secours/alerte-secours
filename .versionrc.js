const appPackageJsonPath = "app/package.json";

// Updater for app versionCode (as integer)
const versionCodeUpdater = {
  readVersion: (contents) => {
    const packageJson = JSON.parse(contents);
    return packageJson.customExpoVersioning.versionCode.toString();
  },
  writeVersion: (contents) => {
    const packageJson = JSON.parse(contents);
    packageJson.customExpoVersioning.versionCode += 1;
    return JSON.stringify(packageJson, null, 2);
  },
};

// Updater for app buildNumber (as integer)
const buildNumberUpdater = {
  readVersion: (contents) => {
    const packageJson = JSON.parse(contents);
    return packageJson.customExpoVersioning.buildNumber.toString();
  },
  writeVersion: (contents) => {
    const packageJson = JSON.parse(contents);
    packageJson.customExpoVersioning.buildNumber += 1;
    return JSON.stringify(packageJson, null, 2);
  },
};

module.exports = {
  bumpFiles: [
    { filename: "package.json", type: "json" },
    { filename: appPackageJsonPath, type: "json" },
    { filename: appPackageJsonPath, updater: versionCodeUpdater },
    { filename: appPackageJsonPath, updater: buildNumberUpdater },
    { filename: "services/api/package.json", type: "json" },
    { filename: "services/tasks/package.json", type: "json" },
    { filename: "services/watchers/package.json", type: "json" },
    { filename: "services/web/package.json", type: "json" },
    { filename: "services/hasura/version.json", type: "json" },
  ],
  types: [
    { type: "feat", section: "Features" },
    { type: "fix", section: "Bug Fixes" },
    { type: "chore", hidden: true },
    { type: "docs", hidden: true },
    { type: "style", hidden: true },
    { type: "refactor", hidden: true },
    { type: "perf", hidden: true },
    { type: "test", hidden: true },
  ],
  commitUrlFormat:
    "https://codeberg.org/alerte-secours/alerte-secours/commit/{{hash}}",
  compareUrlFormat:
    "https://codeberg.org/alerte-secours/alerte-secours/compare/{{previousTag}}...{{currentTag}}",
};
