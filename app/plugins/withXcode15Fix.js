const { withXcodeProject } = require("@expo/config-plugins");

const withXcode15Fix = (config) => {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const shellScript = `if [ "$XCODE_VERSION_MAJOR" = "1500" ]; then
  echo "Remove signature files (Xcode 15 workaround)"
  find "$BUILD_DIR/\${CONFIGURATION}-iphoneos" -name "*.signature" -type f | xargs -r rm
fi`;

    xcodeProject.addBuildPhase(
      [],
      "PBXShellScriptBuildPhase",
      "Fix Xcode 15 Bug",
      null,
      {
        shellPath: "/bin/sh",
        shellScript,
      },
    );

    return config;
  });
};

module.exports = withXcode15Fix;
