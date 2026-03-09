const packageJsonPath = "package.json";

// Updater for versionCode (as integer)
const versionCodeUpdater = {
  readVersion: (contents) => {
    const packageJson = JSON.parse(contents);
    return packageJson.customExpoVersioning.versionCode.toString();
  },
  writeVersion: (contents) => {
    const packageJson = JSON.parse(contents);
    packageJson.customExpoVersioning.versionCode += 1; // Increment as integer
    return JSON.stringify(packageJson, null, 2);
  }
};

// Updater for buildNumber (as integer)
const buildNumberUpdater = {
  readVersion: (contents) => {
    const packageJson = JSON.parse(contents);
    return packageJson.customExpoVersioning.buildNumber.toString();
  },
  writeVersion: (contents) => {
    const packageJson = JSON.parse(contents);
    packageJson.customExpoVersioning.buildNumber += 1; // Increment as integer
    return JSON.stringify(packageJson, null, 2);
  }
};

module.exports = {
  bumpFiles: [
    { filename: packageJsonPath, type: "json" },
    { filename: packageJsonPath, updater: versionCodeUpdater },
    { filename: packageJsonPath, updater: buildNumberUpdater }
  ]
};
