const packageJson = require("./package.json");
const { version, customExpoVersioning } = packageJson;
const withXcode15Fix = require("./plugins/withXcode15Fix");

let config = {
  expo: {
    name: "Alerte Secours",
    slug: "alerte-secours",
    runtimeVersion: `${version.split(".")[0]}.0.0`,
    version,
    updates: {
      url: "https://expo-updates.alertesecours.fr/api/manifest?project=alerte-secours&channel=release",
      enabled: true,
      checkAutomatically: "ON_ERROR_RECOVERY",
      fallbackToCacheTimeout: 0,
      codeSigningCertificate: "./keys/certificate.pem",
      codeSigningPrivateKey: "./keys/private-key.pem",
      codeSigningMetadata: {
        keyid: "main",
        alg: "rsa-v1_5-sha256",
      },
    },
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./src/assets/img/splash-icon.png",
      backgroundColor: "#364fc7",
      resizeMode: "contain",
      imageWidth: 200,
    },
    // Add notification configuration at root level
    notification: {
      androidMode: "default",
      androidCollapsedTitle: "#{unread_notifications} nouvelles notifications",
      // Use mipmap for the notification icon
      icon: "./src/assets/img/notification-android.png",
      color: "#364fc7",
    },
    platforms: ["ios", "android"],
    android: {
      versionCode: customExpoVersioning.versionCode,
      googleServicesFile:
        process.env.ANDROID_GOOGLE_SERVICES_FILE_PATH ||
        "./android/app/google-services.json",
      package: "com.alertesecours",
      intentFilters: [
        {
          action: "VIEW",
          data: {
            scheme: "https",
            host: "app.alertesecours.fr",
            pathPrefix: "/",
          },
          category: ["BROWSABLE", "DEFAULT"],
          autoVerify: true,
        },
      ],
      permissions: [
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.CALL_PHONE",
        "android.permission.CAMERA",
        "android.permission.INTERNET",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.READ_CONTACTS",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.RECORD_AUDIO",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.VIBRATE",
        "android.permission.WRITE_CONTACTS",
        "android.permission.WRITE_EXTERNAL_STORAGE",
      ],
    },
    ios: {
      buildNumber: customExpoVersioning.buildNumber.toString(),
      googleServicesFile:
        process.env.IOS_GOOGLE_SERVICES_FILE_PATH ||
        "./ios/GoogleService-Info.plist",
      userInterfaceStyle: "automatic",
      supportsTablet: true,
      bundleIdentifier: "com.alertesecours.alertesecours",
      associatedDomains: ["applinks:app.alertesecours.fr"],
      icon: "./src/assets/img/logo.png",
      entitlements: {
        "aps-environment": "production",
      },
      config: {
        usesNonExemptEncryption: false,
      },
      infoPlist: {
        NSCameraUsageDescription:
          "Alerte-Secours requiert l'accès à votre caméra pour vous permettre de prendre une photo de profil. Cette fonctionnalité est utilisée uniquement lors de la personnalisation de votre compte.",
        NSContactsUsageDescription:
          "Alerte-Secours demande l'accès à vos contacts pour afficher les noms associés aux numéros de téléphone. Ces informations restent strictement sur votre appareil et ne sont jamais partagées ni transmises à des tiers.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "Alerte-Secours nécessite la localisation en arrière-plan pour vous alerter en temps réel lorsqu'une personne à proximité a besoin d'aide urgente. Cette fonction est essentielle pour permettre une intervention rapide et efficace en cas d'urgence.",
        NSLocationWhenInUseUsageDescription:
          "Alerte-Secours utilise votre localisation pour identifier et vous diriger vers les personnes nécessitant une assistance à proximité. Cette fonction est cruciale pour une intervention rapide et précise en cas d'urgence.",
        NSLocationAccuracyReduced:
          "Alerte-Secours nécessite une localisation précise pour optimiser l'assistance aux personnes en détresse. Cette précision est essentielle pour localiser efficacement et rejoindre rapidement les personnes ayant besoin d'aide.",
        NSMicrophoneUsageDescription:
          "Alerte-Secours requiert l'accès au microphone pour l'enregistrement de messages vocaux. Cette fonction permet une communication plus rapide et plus claire en situation d'urgence.",
        NSMotionUsageDescription:
          "Alerte-Secours utilise la détection de mouvement pour optimiser la géolocalisation en arrière-plan, réduisant ainsi la consommation de batterie. Aucune donnée de mouvement n'est stockée ni transmise.",
        NSPhotoLibraryUsageDescription:
          "Alerte-Secours demande l'accès à votre photothèque uniquement pour vous permettre de sélectionner une photo de profil. Cette fonctionnalité est utilisée exclusivement pour la personnalisation de votre compte.",
        NSUserNotificationUsageDescription:
          "Alerte-Secours utilise les notifications pour vous informer immédiatement lorsqu'une personne à proximité nécessite une assistance urgente. Ces alertes sont essentielles pour une réponse rapide aux situations d'urgence.",
        LSApplicationQueriesSchemes: [
          "http",
          "https",
          "comgooglemaps",
          "maps",
          "waze",
          "citymapper",
          "uber",
          "lyft",
          "transit",
          "truckmap",
          "waze-na",
          "yandexnavi",
          "moovit",
          "yandexmaps",
          "kakaomap",
          "szn-mapy",
          "mapsme",
          "osmand",
          "gett",
          "nmap",
          "dgis",
          "tel",
          "telprompt",
        ],
        BGTaskSchedulerPermittedIdentifiers: [
          "com.transistorsoft",
          "com.transistorsoft.fetch",
          "com.transistorsoft.customtask",
        ],
      },
      UIBackgroundModes: ["location", "fetch", "processing"],
      TSLocationManagerLicense: process.env.BACKGROUND_GEOLOCATION_LICENSE_IOS,
    },
    plugins: [
      [
        "expo-gradle-ext-vars",
        {
          googlePlayServicesLocationVersion: "21.1.0",
          appCompatVersion: "1.4.2",
        },
      ],
      "@maplibre/maplibre-react-native",
      "expo-location",
      "react-native-map-link",
      "expo-localization",
      "expo-secure-store",
      [
        "@sentry/react-native/expo",
        {
          url: process.env.SENTRY_URL,
          organization: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          android: {
            // Android release name format
            release: `com.alertesecours@${version}+${customExpoVersioning.versionCode}`,
          },
          ios: {
            // iOS release name format
            release: `com.alertesecours.alertesecours@${version}+${customExpoVersioning.buildNumber}`,
          },
        },
      ],
      "@react-native-firebase/app",
      "@react-native-firebase/messaging",
      [
        // see https://rnfirebase.io/#configure-react-native-firebase-modules
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            deploymentTarget: "15.1",
          },
          android: {
            enableProguardInReleaseBuilds: true,
            enableDexGuardInReleaseBuilds: true,
            extraProperties: {
              "android.nonTransitiveRClass": true,
              "android.useAndroidX": true,
            },
          },
        },
      ],
      "expo-audio",
      "./plugins/withXcode15Fix",
      "./plugins/withCustomScheme", // Preserve URL schemes during prebuild
    ],
    // Disable Flipper
    extra: {
      flipperEnabled: false,
    },
  },
};

// Apply plugins
config = withXcode15Fix(config);
config = require("./plugins/withCustomScheme")(config);

module.exports = config;
