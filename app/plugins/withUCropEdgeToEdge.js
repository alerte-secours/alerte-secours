const {
  withAndroidManifest,
  withAndroidStyles,
} = require("@expo/config-plugins");

const UCROP_ACTIVITY = "com.yalantis.ucrop.UCropActivity";
const UCROP_THEME = "Theme.App.UCrop";

// react-native-image-crop-picker bundles an old uCrop whose toolbar (holding the
// "done" check button) does not consume window insets. On Android 15+ (targetSdk 35)
// edge-to-edge is enforced, so that toolbar is drawn under the status bar and the
// check button ends up partially off-screen / unclickable.
//
// The fix is scoped strictly to the cropper activity: a dedicated theme identical to
// the library default (Theme.AppCompat.Light.NoActionBar) plus the edge-to-edge
// opt-out. It never touches AppTheme / MainActivity, so the rest of the app is
// unaffected. On Android < 15 the opt-out attribute is ignored, so appearance is
// unchanged from the library default.
function withUCropStyle(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults.resources.style ?? [];

    if (!styles.some((style) => style.$?.name === UCROP_THEME)) {
      styles.push({
        $: { name: UCROP_THEME, parent: "Theme.AppCompat.Light.NoActionBar" },
        item: [
          {
            $: {
              name: "android:windowOptOutEdgeToEdgeEnforcement",
              "tools:targetApi": "35",
            },
            _: "true",
          },
        ],
      });
    }

    config.modResults.resources.style = styles;
    return config;
  });
}

function withUCropManifest(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) return config;

    if (!Array.isArray(application.activity)) {
      application.activity = [];
    }

    let ucrop = application.activity.find(
      (activity) => activity?.$?.["android:name"] === UCROP_ACTIVITY,
    );
    if (!ucrop) {
      ucrop = { $: { "android:name": UCROP_ACTIVITY } };
      application.activity.push(ucrop);
    }

    ucrop.$["android:theme"] = `@style/${UCROP_THEME}`;
    ucrop.$["tools:replace"] = "android:theme";

    return config;
  });
}

module.exports = function withUCropEdgeToEdge(config) {
  config = withUCropStyle(config);
  config = withUCropManifest(config);
  return config;
};
