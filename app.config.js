export default {
  expo: {
    name: "CalorieCam",
    slug: "caloriecam",
    owner: "eatsense",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",

    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
      environment: process.env.EXPO_PUBLIC_ENV,
      eas: { projectId: "23f73ee7-a478-4c3d-bdf9-78f6cec090a8" }
    },

    splash: { image: "./assets/splash.png", resizeMode: "contain", backgroundColor: "#ffffff" },
    scheme: "caloriecam",

    ios: {
      bundleIdentifier: "ch.eatsense.app",      // <-- ВАЖНО: именно такой
      supportsTablet: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription:
          "CalorieCam needs access to your camera to take photos of food for nutrition analysis.",
        NSPhotoLibraryUsageDescription:
          "CalorieCam needs access to your photo library to select food photos for nutrition analysis.",
        NSPhotoLibraryAddUsageDescription:
          "CalorieCam needs access to save analyzed food photos to your library.",
        NSLocationWhenInUseUsageDescription:
          "CalorieCam may use your location to provide location-based nutrition recommendations (optional).",
        NSHealthShareUsageDescription:
          "CalorieCam can integrate with HealthKit to sync nutrition data (optional).",
        NSHealthUpdateUsageDescription:
          "CalorieCam can update HealthKit with your nutrition data (optional)."
      },
      associatedDomains: ["applinks:caloriecam.app", "applinks:*.caloriecam.app"]
    },

    android: {
      package: "app.eatsense.caloriecam",
      adaptiveIcon: { foregroundImage: "./assets/adaptive-icon.png", backgroundColor: "#FFFFFF" },
      permissions: ["CAMERA","READ_MEDIA_IMAGES","ACCESS_FINE_LOCATION","ACCESS_COARSE_LOCATION","POST_NOTIFICATIONS"],
      intentFilters: [{
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "https", host: "caloriecam.app", pathPrefix: "/v1/auth/magic/consume" }, { scheme: "caloriecam" }],
        category: ["BROWSABLE","DEFAULT"]
      }]
    },

    web: { favicon: "./assets/favicon.png" },
    notification: { icon: "./assets/icon.png", color: "#FF6B6B", androidMode: "default", androidCollapsedTitle: "CalorieCam" },
    plugins: ["expo-camera","expo-image-picker","expo-media-library","expo-localization","expo-notifications"]
  }
};
