const { withInfoPlist } = require("@expo/config-plugins");

module.exports = function withCustomScheme(config) {
  return withInfoPlist(config, (config) => {
    // Ensure CFBundleURLTypes exists
    if (!config.modResults.CFBundleURLTypes) {
      config.modResults.CFBundleURLTypes = [];
    }

    // Find or create our custom scheme entry
    let customSchemeEntry = config.modResults.CFBundleURLTypes.find((entry) =>
      entry.CFBundleURLSchemes?.includes("com.alertesecours.alertesecours"),
    );

    if (!customSchemeEntry) {
      customSchemeEntry = {
        CFBundleURLName: "com.alertesecours.alertesecours",
        CFBundleURLSchemes: ["com.alertesecours.alertesecours"],
      };
      config.modResults.CFBundleURLTypes.push(customSchemeEntry);
    } else if (!customSchemeEntry.CFBundleURLName) {
      customSchemeEntry.CFBundleURLName = "com.alertesecours.alertesecours";
    }

    // Find or create Expo scheme entry
    let expoSchemeEntry = config.modResults.CFBundleURLTypes.find((entry) =>
      entry.CFBundleURLSchemes?.includes("exp+alerte-secours"),
    );

    if (!expoSchemeEntry) {
      expoSchemeEntry = {
        CFBundleURLName: "com.alertesecours.alertesecours.expo",
        CFBundleURLSchemes: ["exp+alerte-secours"],
      };
      config.modResults.CFBundleURLTypes.push(expoSchemeEntry);
    } else if (!expoSchemeEntry.CFBundleURLName) {
      expoSchemeEntry.CFBundleURLName = "com.alertesecours.alertesecours.expo";
    }

    return config;
  });
};
