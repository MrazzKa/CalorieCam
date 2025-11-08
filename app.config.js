export default {
  expo: {
    name: "CalorieCam",
    slug: "caloriecam",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      environment: process.env.EXPO_PUBLIC_ENV,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || "replace-with-eas-project-id"
      }
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: process.env.EXPO_UPDATES_URL
    },
    splash: {
      image: "./assets/splash.png", // Using PNG for native splash - custom SVG logo shown in app
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    scheme: "caloriecam",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.caloriecam.app",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription: "CalorieCam needs access to your camera to take photos of food for nutrition analysis.",
        NSPhotoLibraryUsageDescription: "CalorieCam needs access to your photo library to select food photos for nutrition analysis.",
        NSPhotoLibraryAddUsageDescription: "CalorieCam needs access to save analyzed food photos to your library.",
        NSLocationWhenInUseUsageDescription: "CalorieCam may use your location to provide location-based nutrition recommendations (optional).",
        NSHealthShareUsageDescription: "CalorieCam can integrate with HealthKit to sync nutrition data (optional).",
        NSHealthUpdateUsageDescription: "CalorieCam can update HealthKit with your nutrition data (optional)."
      },
      associatedDomains: [
        "applinks:caloriecam.app",
        "applinks:*.caloriecam.app"
      ]
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      },
      package: "com.caloriecam.app",
      permissions: [
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "READ_MEDIA_IMAGES",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "POST_NOTIFICATIONS"
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "caloriecam.app",
              pathPrefix: "/v1/auth/magic/consume"
            },
            {
              scheme: "caloriecam"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    notification: {
      icon: "./assets/icon.png",
      color: "#FF6B6B",
      androidMode: "default",
      androidCollapsedTitle: "CalorieCam"
    },
    plugins: [
      "expo-camera",
      "expo-image-picker",
      "expo-media-library",
      "expo-localization",
      "expo-notifications"
    ]
  }
};
